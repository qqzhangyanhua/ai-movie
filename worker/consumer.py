"""Redis-based consumer for BullMQ ai-tasks queue."""

import json
import logging
import time
import uuid
from urllib.parse import urlparse

import psycopg2
import redis

from config import DATABASE_URL, REDIS_URL
from services.llm_service import generate_script
from services.video_service import generate_video_clip
from services.image_service import generate_storyboard_preview
from services.character_service import generate_character_embedding, generate_character_views
from services.voice_service import generate_scene_voiceovers
from services.music_service import generate_project_bgm

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

QUEUE_PREFIX = "bull:ai-tasks"
WAIT_LIST = f"{QUEUE_PREFIX}:wait"
BLOCK_TIMEOUT = 5


def get_redis():
    """Create Redis connection from URL."""
    parsed = urlparse(REDIS_URL)
    return redis.Redis(
        host=parsed.hostname or "localhost",
        port=parsed.port or 6379,
        db=int(parsed.path.lstrip("/")) if parsed.path else 0,
        decode_responses=True,
    )


def get_db_conn():
    """Create PostgreSQL connection."""
    if not DATABASE_URL:
        return None
    return psycopg2.connect(DATABASE_URL)


def publish_progress(r: redis.Redis, project_id: str, status: str, data: dict | None = None):
    """Publish progress update to progress:{projectId} channel."""
    channel = f"progress:{project_id}"
    payload = {"status": status, "data": data or {}}
    r.publish(channel, json.dumps(payload))
    logger.info("Progress %s -> %s: %s", project_id, status, payload)


def handle_script_generate(r: redis.Redis, conn, payload: dict) -> None:
    """Handle script:generate task. Uses real LLM and saves to DB."""
    project_id = payload.get("projectId", "")
    publish_progress(r, project_id, "processing", {"step": "generating"})

    prompt = (payload.get("data") or {}).get("prompt", "")
    characters = (payload.get("data") or {}).get("characters", [])

    script_data = generate_script(prompt, characters)
    scenes = script_data.get("scenes", [])
    title = script_data.get("title", prompt[:20] if prompt else "AI 微电影")
    metadata = json.dumps({"title": title})
    content = json.dumps(scenes)

    if conn:
        try:
            cur = conn.cursor()
            script_id = str(uuid.uuid4())
            cur.execute(
                """
                INSERT INTO "Script" (id, "projectId", type, content, metadata)
                VALUES (%s, %s, 'AI_GENERATED', %s::jsonb, %s::jsonb)
                ON CONFLICT ("projectId") DO UPDATE SET
                    type = EXCLUDED.type,
                    content = EXCLUDED.content,
                    metadata = EXCLUDED.metadata,
                    "updatedAt" = NOW()
                """,
                (script_id, project_id, content, metadata),
            )
            cur.execute(
                """
                UPDATE "Project" SET status = 'SCRIPT_READY'
                WHERE id = %s
                """,
                (project_id,),
            )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()

    publish_progress(r, project_id, "completed", {"script": script_data})


def handle_video_compose(r: redis.Redis, conn, payload: dict) -> None:
    """Handle video:compose task. Stub simulates video composition."""
    project_id = payload.get("projectId", "")
    publish_progress(r, project_id, "processing", {"step": "composing"})
    time.sleep(0.5)
    publish_progress(r, project_id, "completed", {"videoUrl": "/uploads/mock-video.mp4"})
    if conn:
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE "Video" SET status = 'COMPLETED', "videoUrl" = '/uploads/mock-video.mp4', progress = 100
                WHERE id = (SELECT id FROM "Video" WHERE "projectId" = %s ORDER BY "createdAt" DESC LIMIT 1)
                """,
                (project_id,),
            )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()


def handle_character_generate(r: redis.Redis, conn, payload: dict) -> None:
    """Handle character:generate task. Generates three views via DALL-E 3 and updates DB."""
    project_id = payload.get("projectId", "")
    data = payload.get("data") or {}
    photo_url = data.get("photoUrl", "")
    character_name = data.get("characterName", "")
    character_id = data.get("characterId", "")

    publish_progress(r, project_id, "processing", {"step": "generating"})

    views = generate_character_views(photo_url, character_name)

    personality = data.get("personality", "") or ""
    style = data.get("style", "") or ""
    embedding_bytes = generate_character_embedding(character_name, personality, style)

    if conn:
        try:
            cur = conn.cursor()
            if character_id:
                cur.execute(
                    """
                    UPDATE "Character"
                    SET "frontViewUrl" = %s, "sideViewUrl" = %s, "backViewUrl" = %s
                    WHERE id = %s
                      AND id IN (SELECT "characterId" FROM "ProjectCharacter" WHERE "projectId" = %s)
                    """,
                    (
                        views.get("front_view_url"),
                        views.get("side_view_url"),
                        views.get("back_view_url"),
                        character_id,
                        project_id,
                    ),
                )
            else:
                cur.execute(
                    """
                    UPDATE "Character" c
                    SET "frontViewUrl" = %s, "sideViewUrl" = %s, "backViewUrl" = %s
                    FROM "ProjectCharacter" pc
                    WHERE c.id = pc."characterId" AND pc."projectId" = %s
                      AND (c.name = %s OR c."photoUrl" = %s)
                    """,
                    (
                        views.get("front_view_url"),
                        views.get("side_view_url"),
                        views.get("back_view_url"),
                        project_id,
                        character_name,
                        photo_url,
                    ),
                )
            if embedding_bytes:
                if character_id:
                    cur.execute(
                        """
                        UPDATE "Character"
                        SET "embedding" = %s
                        WHERE id = %s
                          AND id IN (SELECT "characterId" FROM "ProjectCharacter" WHERE "projectId" = %s)
                        """,
                        (psycopg2.Binary(embedding_bytes), character_id, project_id),
                    )
                else:
                    cur.execute(
                        """
                        UPDATE "Character" c
                        SET "embedding" = %s
                        FROM "ProjectCharacter" pc
                        WHERE c.id = pc."characterId" AND pc."projectId" = %s
                          AND (c.name = %s OR c."photoUrl" = %s)
                        """,
                        (
                            psycopg2.Binary(embedding_bytes),
                            project_id,
                            character_name,
                            photo_url,
                        ),
                    )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()

    publish_progress(r, project_id, "completed", {"views": views})


def handle_video_clip(r: redis.Redis, conn, payload: dict) -> None:
    """Handle video:clip task. Stub."""
    project_id = payload.get("projectId", "")
    storyboard_id = (payload.get("data") or {}).get("storyboardId", "")
    publish_progress(r, project_id, "processing", {"storyboardId": storyboard_id})
    time.sleep(0.5)
    storyboard_data = (payload.get("data") or {}).get("storyboard", {})
    video_url = generate_video_clip(storyboard_data)
    publish_progress(r, project_id, "completed", {"videoUrl": video_url})
    if conn and storyboard_id:
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE "VideoClip" SET status = 'COMPLETED', "videoUrl" = %s, progress = 100
                WHERE "storyboardId" = %s
                """,
                (video_url, storyboard_id),
            )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()


def handle_storyboard_preview(r: redis.Redis, conn, payload: dict) -> None:
    """Handle storyboard:preview task. Generates image via DALL-E and updates DB."""
    project_id = payload.get("projectId", "")
    data = payload.get("data") or {}
    storyboard_id = data.get("storyboardId", "")
    description = data.get("description", "")
    camera_type = data.get("cameraType", "中景")
    action = data.get("action", "")

    publish_progress(r, project_id, "processing", {"storyboardId": storyboard_id})

    image_url = generate_storyboard_preview(description, camera_type, action)

    if conn and storyboard_id and image_url:
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE "Storyboard" SET "imageUrl" = %s, "updatedAt" = NOW()
                WHERE id = %s
                """,
                (image_url, storyboard_id),
            )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()

    publish_progress(r, project_id, "completed", {"storyboardId": storyboard_id})


def handle_voice_generate(r: redis.Redis, conn, payload: dict) -> None:
    """Handle voice:generate task."""
    project_id = payload.get("projectId", "")
    data = payload.get("data") or {}
    scenes = data.get("scenes", [])

    publish_progress(r, project_id, "processing", {"step": "generating_voiceover"})

    results = generate_scene_voiceovers(scenes)
    voiceover_url = None
    if results:
        voiceover_url = results[0].get("voiceover_url")

    if conn and voiceover_url:
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE "Video" SET "voiceoverUrl" = %s
                WHERE id = (SELECT id FROM "Video" WHERE "projectId" = %s ORDER BY "createdAt" DESC LIMIT 1)
                """,
                (voiceover_url, project_id),
            )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()

    publish_progress(r, project_id, "completed", {"voiceoverUrl": voiceover_url, "scenes": results})


def handle_music_generate(r: redis.Redis, conn, payload: dict) -> None:
    """Handle music:generate task. Generates BGM and updates Video.bgmUrl."""
    project_id = payload.get("projectId", "")
    data = payload.get("data") or {}
    scenes = data.get("scenes", [])
    total_duration = data.get("totalDuration", 30)

    publish_progress(r, project_id, "processing", {"step": "generating_bgm"})

    bgm_url = generate_project_bgm(scenes, total_duration)

    if conn:
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE "Video" SET "bgmUrl" = %s
                WHERE id = (SELECT id FROM "Video" WHERE "projectId" = %s ORDER BY "createdAt" DESC LIMIT 1)
                """,
                (bgm_url, project_id),
            )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()

    publish_progress(r, project_id, "completed", {"bgmUrl": bgm_url})


HANDLERS = {
    "script:generate": handle_script_generate,
    "video:compose": handle_video_compose,
    "character:generate": handle_character_generate,
    "video:clip": handle_video_clip,
    "storyboard:preview": handle_storyboard_preview,
    "voice:generate": handle_voice_generate,
    "music:generate": handle_music_generate,
}


def process_job(r: redis.Redis, conn, job_id: str) -> bool:
    """Fetch job data and route to handler."""
    key = f"{QUEUE_PREFIX}:{job_id}"
    data_raw = r.hget(key, "data")
    name = r.hget(key, "name") or "unknown"
    if not data_raw:
        logger.warning("Job %s has no data", job_id)
        return False
    try:
        payload = json.loads(data_raw)
    except json.JSONDecodeError:
        payload = {"taskType": name, "projectId": "", "userId": "", "data": {}}
    task_type = payload.get("taskType") or name
    handler = HANDLERS.get(task_type)
    if handler:
        logger.info("Processing %s for project %s", task_type, payload.get("projectId"))
        handler(r, conn, payload)
    else:
        logger.warning("No handler for task type: %s", task_type)
    return True


def main():
    """Main consumer loop."""
    r = get_redis()
    logger.info("Worker started, listening on %s", WAIT_LIST)
    while True:
        conn = None
        try:
            conn = get_db_conn()
        except Exception as e:
            logger.warning("DB connection failed: %s", e)
        result = r.blpop(WAIT_LIST, timeout=BLOCK_TIMEOUT)
        if result:
            _, job_id = result
            logger.info("Got job: %s", job_id)
            try:
                process_job(r, conn, job_id)
            except Exception as e:
                logger.exception("Job failed: %s", e)
        if conn:
            try:
                conn.close()
            except Exception:
                pass


if __name__ == "__main__":
    main()
