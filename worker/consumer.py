"""Redis-based consumer for BullMQ ai-tasks queue."""

import json
import logging
import time
import uuid
from urllib.parse import urlparse

import psycopg2
import redis

from config import (
    DATABASE_URL,
    OPENAI_API_KEY,
    REDIS_URL,
    S3_ACCESS_KEY,
    S3_BUCKET,
    S3_ENDPOINT,
    S3_REGION,
    S3_SECRET_KEY,
    VIDEO_API_KEY,
    VIDEO_BASE_URL,
    VIDEO_MODEL,
    VIDEO_PROVIDER,
)
from services.llm_service import generate_script
from services.video_service import generate_video_clip
from services.image_service import generate_storyboard_preview
from services.poster_service import generate_poster
from utils.ffmpeg_compose import compose_video, compose_video_from_clips
from services.character_service import (
    describe_character_from_photo,
    generate_character_embedding,
    generate_character_views,
)
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


def _ensure_project_exists(conn, project_id: str) -> dict | None:
    if not conn:
        return None

    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, "userId", title, description, "coverUrl"
        FROM "Project"
        WHERE id = %s
        """,
        (project_id,),
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        return None

    return {
        "id": row[0],
        "userId": row[1],
        "title": row[2],
        "description": row[3],
        "coverUrl": row[4],
    }


def _ensure_project_characters(
    conn,
    project_id: str,
    user_id: str,
    photo_urls: list[str],
    title: str,
    description: str | None,
) -> list[dict]:
    cur = conn.cursor()
    cur.execute(
        """
        SELECT c.id, c.name, c."photoUrl", c.personality, c.style, pc."roleName"
        FROM "ProjectCharacter" pc
        JOIN "Character" c ON c.id = pc."characterId"
        WHERE pc."projectId" = %s
        ORDER BY c."createdAt" ASC
        """,
        (project_id,),
    )
    existing_rows = cur.fetchall()
    if existing_rows:
        cur.close()
        return [
            {
                "id": row[0],
                "name": row[1],
                "photoUrl": row[2],
                "personality": row[3] or "",
                "style": row[4] or "",
                "roleName": row[5] or row[1],
            }
            for row in existing_rows
        ]

    characters = []
    project_context = f"标题：{title}；描述：{description or '无'}"
    for index, photo_url in enumerate(photo_urls):
        fallback_name = f"角色{index + 1}"
        profile = describe_character_from_photo(photo_url, fallback_name, project_context)

        cur.execute(
            """
            SELECT id, name, "photoUrl", personality, style
            FROM "Character"
            WHERE "userId" = %s AND "photoUrl" = %s
            LIMIT 1
            """,
            (user_id, photo_url),
        )
        character_row = cur.fetchone()

        if character_row:
            character_id = character_row[0]
            cur.execute(
                """
                UPDATE "Character"
                SET name = %s, personality = %s, style = %s
                WHERE id = %s
                """,
                (
                    profile["name"],
                    profile["personality"],
                    profile["style"],
                    character_id,
                ),
            )
            name = profile["name"]
            personality = profile["personality"]
            style = profile["style"]
        else:
            character_id = str(uuid.uuid4())
            name = profile["name"]
            personality = profile["personality"]
            style = profile["style"]
            cur.execute(
                """
                INSERT INTO "Character" (
                    id, "userId", name, "photoUrl", personality, style, "createdAt"
                ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """,
                (
                    character_id,
                    user_id,
                    name,
                    photo_url,
                    personality,
                    style,
                ),
            )

        cur.execute(
            """
            INSERT INTO "ProjectCharacter" (
                id, "projectId", "characterId", relationship, "roleName"
            ) VALUES (%s, %s, %s, NULL, %s)
            ON CONFLICT ("projectId", "characterId") DO UPDATE SET
                "roleName" = EXCLUDED."roleName"
            """,
            (str(uuid.uuid4()), project_id, character_id, name),
        )

        characters.append(
            {
                "id": character_id,
                "name": name,
                "photoUrl": photo_url,
                "personality": personality or "",
                "style": style or "",
                "roleName": name,
            }
        )

    conn.commit()
    cur.close()
    return characters


def _save_script(conn, project_id: str, script_data: dict, photo_urls: list[str], characters: list[dict]) -> None:
    cur = conn.cursor()
    metadata = json.dumps(
        {
            "title": script_data.get("title") or "AI Movie",
            "photoUrls": photo_urls,
            "characters": [
                {
                    "name": character.get("name", ""),
                    "personality": character.get("personality", ""),
                    "style": character.get("style", ""),
                    "photoUrl": character.get("photoUrl", ""),
                }
                for character in characters
            ],
        }
    )
    content = json.dumps(script_data.get("scenes", []))

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
        (str(uuid.uuid4()), project_id, content, metadata),
    )
    cur.execute(
        """
        UPDATE "Project"
        SET status = 'SCRIPT_READY', "updatedAt" = NOW()
        WHERE id = %s
        """,
        (project_id,),
    )
    conn.commit()
    cur.close()


def _replace_scenes(
    conn,
    project_id: str,
    scenes: list[dict],
    photo_urls: list[str],
    characters: list[dict],
) -> int:
    cur = conn.cursor()
    cur.execute(
        """
        DELETE FROM "Scene"
        WHERE "projectId" = %s
        """,
        (project_id,),
    )

    total_duration = 0
    fallback_character_names = [character.get("name", "") for character in characters if character.get("name")]
    for index, scene in enumerate(scenes):
        duration = int(scene.get("duration", 5) or 5)
        total_duration += duration
        image_url = photo_urls[index % len(photo_urls)] if photo_urls else None
        raw_scene_characters = scene.get("characters", [])
        scene_characters = (
            [str(name).strip() for name in raw_scene_characters if str(name).strip()]
            if isinstance(raw_scene_characters, list)
            else []
        )
        if not scene_characters:
            scene_characters = fallback_character_names[:1] if fallback_character_names else ["主角"]
        cur.execute(
            """
            INSERT INTO "Scene" (
                id, "projectId", "sceneNumber", description, characters,
                action, "cameraType", duration, "videoUrl", status, progress,
                "errorMessage", "imageUrl", "createdAt", "updatedAt"
            ) VALUES (
                %s, %s, %s, %s, %s::text[], %s, %s, %s, %s, 'COMPLETED', 100,
                NULL, %s, NOW(), NOW()
            )
            """,
            (
                str(uuid.uuid4()),
                project_id,
                int(scene.get("sceneNumber", index + 1) or index + 1),
                scene.get("description", ""),
                scene_characters,
                scene.get("action", ""),
                scene.get("cameraType", "中景"),
                duration,
                image_url,
                image_url,
            ),
        )

    cur.execute(
        """
        UPDATE "Project"
        SET status = 'STORYBOARD_READY', "updatedAt" = NOW()
        WHERE id = %s
        """,
        (project_id,),
    )
    conn.commit()
    cur.close()
    return total_duration


def _create_video_record(conn, project_id: str, total_duration: int, cover_url: str | None) -> str:
    cur = conn.cursor()
    cur.execute(
        """
        DELETE FROM "Video"
        WHERE "projectId" = %s AND status IN ('PENDING', 'PROCESSING', 'FAILED')
        """,
        (project_id,),
    )

    video_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO "Video" (
            id, "projectId", "videoUrl", "posterUrl", duration, resolution,
            status, progress, "subtitleUrl", "bgmUrl", "voiceoverUrl",
            "errorMessage", "createdAt"
        ) VALUES (
            %s, %s, NULL, %s, %s, %s, 'PENDING', 0, NULL, NULL, NULL, NULL, NOW()
        )
        """,
        (
            video_id,
            project_id,
            cover_url,
            total_duration,
            "1080p",
        ),
    )
    conn.commit()
    cur.close()
    return video_id


def _set_project_status(conn, project_id: str, status: str) -> None:
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE "Project"
        SET status = %s, "updatedAt" = NOW()
        WHERE id = %s
        """,
        (status, project_id),
    )
    conn.commit()
    cur.close()


def _build_env_video_config() -> dict:
    config = {"provider": VIDEO_PROVIDER}
    if VIDEO_API_KEY:
        config["apiKey"] = VIDEO_API_KEY
    if VIDEO_BASE_URL:
        config["baseUrl"] = VIDEO_BASE_URL
    if VIDEO_MODEL:
        config["model"] = VIDEO_MODEL
    return config


def _build_env_storage_config() -> dict:
    return {
        "endpoint": S3_ENDPOINT,
        "bucket": S3_BUCKET,
        "region": S3_REGION,
        "accessKey": S3_ACCESS_KEY,
        "secretKey": S3_SECRET_KEY,
    }


def build_photo_context_prompt(prompt: str, characters: list[dict], photo_urls: list[str]) -> str:
    character_lines = []
    for index, character in enumerate(characters, start=1):
        parts = [f"{index}. {character.get('name', f'角色{index}')}"]
        if character.get("personality"):
            parts.append(f"性格：{character['personality']}")
        if character.get("style"):
            parts.append(f"外观：{character['style']}")
        character_lines.append("，".join(parts))

    photo_line = f"共上传 {len(photo_urls)} 张照片。" if photo_urls else "未上传照片。"
    if character_lines:
        return (
            f"{prompt}\n\n"
            f"{photo_line}\n"
            "请优先围绕这些角色组织剧情与镜头：\n"
            + "\n".join(character_lines)
        )
    return f"{prompt}\n\n{photo_line}"


def _mark_project_failed(conn, project_id: str, error_message: str) -> None:
    if not conn:
        return

    cur = conn.cursor()
    cur.execute(
        """
        UPDATE "Project"
        SET status = 'FAILED', "updatedAt" = NOW()
        WHERE id = %s
        """,
        (project_id,),
    )
    cur.execute(
        """
        UPDATE "Video"
        SET status = 'FAILED', "errorMessage" = %s
        WHERE "projectId" = %s AND status IN ('PENDING', 'PROCESSING')
        """,
        (error_message[:500], project_id),
    )
    conn.commit()
    cur.close()


def handle_quick_create(r: redis.Redis, conn, payload: dict) -> None:
    """Handle quick-create task end-to-end in worker."""
    project_id = payload.get("projectId", "")
    data = payload.get("data") or {}
    photo_urls = data.get("photoUrls", []) or []

    if not conn:
        logger.error("DB connection unavailable for quick-create task")
        publish_progress(r, project_id, "failed", {"message": "database unavailable"})
        return

    try:
        project = _ensure_project_exists(conn, project_id)
        if not project:
            raise ValueError("Project not found")

        publish_progress(r, project_id, "processing", {"step": "characters"})

        characters = _ensure_project_characters(
            conn,
            project_id,
            project["userId"],
            photo_urls,
            project["title"],
            project["description"],
        )

        publish_progress(r, project_id, "processing", {"step": "script"})

        prompt = data.get("prompt") or project.get("description") or project.get("title") or ""
        llm_config = {"apiKey": OPENAI_API_KEY} if OPENAI_API_KEY else None
        prompt_with_photo_context = build_photo_context_prompt(prompt, characters, photo_urls)
        script_data = generate_script(prompt_with_photo_context, characters, llm_config)
        _save_script(conn, project_id, script_data, photo_urls, characters)

        publish_progress(r, project_id, "processing", {"step": "storyboard"})

        scenes = script_data.get("scenes", [])
        total_duration = _replace_scenes(conn, project_id, scenes, photo_urls, characters)
        video_id = _create_video_record(conn, project_id, total_duration, project.get("coverUrl"))
        _set_project_status(conn, project_id, "GENERATING")

        publish_progress(
            r,
            project_id,
            "processing",
            {"step": "video", "sceneCount": len(scenes), "duration": total_duration},
        )

        handle_video_generate(
            r,
            conn,
            {
                "projectId": project_id,
                "videoId": video_id,
                "userId": payload.get("userId", ""),
                "data": {
                    "scenes": scenes,
                    "characters": characters,
                    "videoGenConfig": _build_env_video_config(),
                    "storageConfig": _build_env_storage_config(),
                },
            },
        )
    except Exception as e:
        logger.exception("Quick-create pipeline failed: %s", e)
        conn.rollback()
        _mark_project_failed(conn, project_id, str(e))
        publish_progress(r, project_id, "failed", {"message": str(e)})


def handle_script_generate(r: redis.Redis, conn, payload: dict) -> None:
    """Handle script:generate task. Uses real LLM and saves to DB."""
    project_id = payload.get("projectId", "")
    publish_progress(r, project_id, "processing", {"step": "generating"})

    data = payload.get("data") or {}
    prompt = data.get("prompt", "")
    characters = data.get("characters", [])
    llm_config = data.get("llmConfig")

    script_data = generate_script(prompt, characters, llm_config)
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
    """Handle video:compose task. Runs FFmpeg pipeline with audio mixing."""
    project_id = payload.get("projectId", "")
    data = payload.get("data") or {}

    publish_progress(r, project_id, "processing", {"step": "preparing"})

    clips = data.get("clips", [])
    bgm_url = data.get("bgmUrl")
    voiceover_url = data.get("voiceoverUrl")
    subtitle_url = data.get("subtitleUrl")

    if conn and not bgm_url:
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT "bgmUrl", "voiceoverUrl", "subtitleUrl"
                FROM "Video" WHERE "projectId" = %s
                ORDER BY "createdAt" DESC LIMIT 1
                """,
                (project_id,),
            )
            row = cur.fetchone()
            if row:
                bgm_url = bgm_url or row[0]
                voiceover_url = voiceover_url or row[1]
                subtitle_url = subtitle_url or row[2]
            cur.close()
        except Exception as e:
            logger.warning("Failed to fetch audio URLs from DB: %s", e)

    publish_progress(r, project_id, "processing", {"step": "composing"})

    output_path = f"/tmp/video_{project_id}_{int(time.time())}.mp4"
    video_path = compose_video(clips, bgm_url, voiceover_url, subtitle_url, output_path)

    publish_progress(r, project_id, "completed", {"videoUrl": video_path})

    if conn:
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE "Video" SET status = 'COMPLETED', "videoUrl" = %s, progress = 100
                WHERE id = (SELECT id FROM "Video" WHERE "projectId" = %s ORDER BY "createdAt" DESC LIMIT 1)
                """,
                (video_path, project_id),
            )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()

    # Auto-generate poster after video compose
    title = data.get("title", "")
    description = data.get("description", "")
    key_scene = data.get("keyScene") or data.get("key_scene", "")
    if conn:
        try:
            cur = conn.cursor()
            if not title or not description:
                cur.execute(
                    """
                    SELECT p.title, p.description FROM "Project" p WHERE p.id = %s
                    """,
                    (project_id,),
                )
                row = cur.fetchone()
                if row:
                    title = title or row[0] or ""
                    description = description or (row[1] or "")
            if not key_scene:
                cur.execute(
                    """
                    SELECT s.description FROM "Storyboard" s
                    WHERE s."projectId" = %s ORDER BY s."sceneNumber" ASC LIMIT 1
                    """,
                    (project_id,),
                )
                sb_row = cur.fetchone()
                if sb_row:
                    key_scene = sb_row[0] or ""
            cur.close()
        except Exception as e:
            logger.warning("Failed to fetch project/storyboard for poster: %s", e)

    if title:
        poster_url = generate_poster(title, description or "", key_scene=key_scene)
        if poster_url and conn:
            try:
                cur = conn.cursor()
                cur.execute(
                    """
                    UPDATE "Video" SET "posterUrl" = %s
                    WHERE id = (SELECT id FROM "Video" WHERE "projectId" = %s ORDER BY "createdAt" DESC LIMIT 1)
                    """,
                    (poster_url, project_id),
                )
                conn.commit()
                cur.close()
            except Exception as e:
                logger.error("Failed to update posterUrl: %s", e)
                conn.rollback()


def handle_poster_generate(r: redis.Redis, conn, payload: dict) -> None:
    """Handle poster:generate task. Generates poster via DALL-E and updates Video.posterUrl."""
    project_id = payload.get("projectId", "")
    data = payload.get("data") or {}
    title = data.get("title", "")
    description = data.get("description", "")
    style = data.get("style", "")
    key_scene = data.get("keyScene") or data.get("key_scene", "")

    publish_progress(r, project_id, "processing", {"step": "generating_poster"})

    if conn and (not title or not description):
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT p.title, p.description FROM "Project" p WHERE p.id = %s
                """,
                (project_id,),
            )
            row = cur.fetchone()
            if row:
                title = title or row[0] or ""
                description = description or (row[1] or "")
            if not key_scene:
                cur.execute(
                    """
                    SELECT s.description FROM "Storyboard" s
                    WHERE s."projectId" = %s ORDER BY s."sceneNumber" ASC LIMIT 1
                    """,
                    (project_id,),
                )
                sb_row = cur.fetchone()
                if sb_row:
                    key_scene = sb_row[0] or ""
            cur.close()
        except Exception as e:
            logger.warning("Failed to fetch project/storyboard: %s", e)

    poster_url = generate_poster(title, description, style=style, key_scene=key_scene)

    if conn and poster_url:
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE "Video" SET "posterUrl" = %s
                WHERE id = (SELECT id FROM "Video" WHERE "projectId" = %s ORDER BY "createdAt" DESC LIMIT 1)
                """,
                (poster_url, project_id),
            )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()

    publish_progress(r, project_id, "completed", {"posterUrl": poster_url})


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


def handle_video_generate(r: redis.Redis, conn, payload: dict) -> None:
    """Handle video:generate task. Generates video clips for all scenes."""
    project_id = payload.get("projectId", "")
    video_id = payload.get("videoId", "")
    data = payload.get("data") or {}
    if not video_id:
        video_id = data.get("videoId", "")
    scenes = data.get("scenes", [])
    characters = data.get("characters", [])
    video_gen_config = data.get("videoGenConfig", {})
    storage_config = data.get("storageConfig", {})

    if not scenes:
        logger.error("No scenes provided for video generation")
        if conn and video_id:
            try:
                cur = conn.cursor()
                cur.execute(
                    """
                    UPDATE "Video" SET status = 'FAILED', "errorMessage" = %s
                    WHERE id = %s
                    """,
                    ("No scenes provided", video_id),
                )
                cur.execute(
                    """
                    UPDATE "Project" SET status = 'FAILED', "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (project_id,),
                )
                conn.commit()
                cur.close()
            except Exception as e:
                logger.error("DB update failed: %s", e)
        publish_progress(r, project_id, "failed", {"message": "No scenes provided"})
        return

    publish_progress(r, project_id, "processing", {"step": "generating_clips", "total": len(scenes)})

    clip_urls = []
    for i, scene in enumerate(scenes):
        try:
            publish_progress(
                r,
                project_id,
                "processing",
                {"step": "generating_clip", "current": i + 1, "total": len(scenes)},
            )

            video_url = generate_video_clip(scene, characters, video_gen_config)
            if video_url:
                clip_urls.append(video_url)

            if conn and video_id:
                progress = int((i + 1) / len(scenes) * 80)
                try:
                    cur = conn.cursor()
                    cur.execute(
                        """
                        UPDATE "Video" SET progress = %s, status = 'PROCESSING'
                        WHERE id = %s
                        """,
                        (progress, video_id),
                    )
                    conn.commit()
                    cur.close()
                except Exception as e:
                    logger.error("DB update failed: %s", e)

        except Exception as e:
            logger.error(f"Failed to generate clip for scene {i + 1}: {e}")
            clip_urls.append(None)

    if not any(clip_urls):
        logger.error("All video clips failed to generate")
        if conn and video_id:
            try:
                cur = conn.cursor()
                cur.execute(
                    """
                    UPDATE "Video" SET status = 'FAILED', "errorMessage" = %s
                    WHERE id = %s
                    """,
                    ("All video clips failed to generate", video_id),
                )
                cur.execute(
                    """
                    UPDATE "Project" SET status = 'FAILED', "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (project_id,),
                )
                conn.commit()
                cur.close()
            except Exception as e:
                logger.error("DB update failed: %s", e)
        publish_progress(r, project_id, "failed", {"message": "All video clips failed to generate"})
        return

    publish_progress(
        r,
        project_id,
        "processing",
        {"step": "composing", "clips": len([c for c in clip_urls if c])},
    )

    final_video_url = compose_video_from_clips(clip_urls, storage_config)

    if conn and video_id:
        try:
            cur = conn.cursor()
            if final_video_url:
                cur.execute(
                    """
                    UPDATE "Video" SET status = 'COMPLETED', "videoUrl" = %s, progress = 100
                    WHERE id = %s
                    """,
                    (final_video_url, video_id),
                )
                cur.execute(
                    """
                    UPDATE "Project" SET status = 'COMPLETED', "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (project_id,),
                )
            else:
                cur.execute(
                    """
                    UPDATE "Video" SET status = 'FAILED', "errorMessage" = %s
                    WHERE id = %s
                    """,
                    ("Video composition failed", video_id),
                )
                cur.execute(
                    """
                    UPDATE "Project" SET status = 'FAILED', "updatedAt" = NOW()
                    WHERE id = %s
                    """,
                    (project_id,),
                )
            conn.commit()
            cur.close()
        except Exception as e:
            logger.error("DB update failed: %s", e)
            conn.rollback()

    if final_video_url:
        publish_progress(r, project_id, "completed", {"videoUrl": final_video_url})
    else:
        publish_progress(r, project_id, "failed", {"message": "Video composition failed"})


HANDLERS = {
    "quick-create": handle_quick_create,
    "script:generate": handle_script_generate,
    "video:compose": handle_video_compose,
    "video:generate": handle_video_generate,
    "character:generate": handle_character_generate,
    "video:clip": handle_video_clip,
    "storyboard:preview": handle_storyboard_preview,
    "voice:generate": handle_voice_generate,
    "music:generate": handle_music_generate,
    "poster:generate": handle_poster_generate,
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
