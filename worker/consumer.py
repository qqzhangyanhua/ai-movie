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
    """Handle character:generate task. Stub."""
    project_id = payload.get("projectId", "")
    publish_progress(r, project_id, "processing", {"step": "generating"})
    time.sleep(0.5)
    publish_progress(r, project_id, "completed", {})
    if conn:
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE "Character" SET "updatedAt" = NOW()
                WHERE id IN (SELECT "characterId" FROM "ProjectCharacter" WHERE "projectId" = %s)
                """,
                (project_id,),
            )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()


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


HANDLERS = {
    "script:generate": handle_script_generate,
    "video:compose": handle_video_compose,
    "character:generate": handle_character_generate,
    "video:clip": handle_video_clip,
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
