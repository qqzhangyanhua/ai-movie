import logging
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.photo import Photo
from app.models.script import Script
from app.models.video_task import VideoTask
from app.tasks import celery_app

logger = logging.getLogger(__name__)

sync_db_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2").replace(
    "postgresql+psycopg2", "postgresql"
)
sync_engine = create_engine(sync_db_url)
SyncSession = sessionmaker(bind=sync_engine)


@celery_app.task(bind=True, max_retries=3)
def generate_video(self, task_id: str) -> None:  # type: ignore[no-untyped-def]
    """Generate video by stitching scene images with FFmpeg."""
    session: Session = SyncSession()
    try:
        task = session.execute(
            select(VideoTask).where(VideoTask.id == uuid.UUID(task_id))
        ).scalar_one_or_none()
        if not task:
            logger.error("Task %s not found", task_id)
            return

        task.status = "processing"
        task.progress = 0
        session.commit()

        script = session.execute(
            select(Script).where(Script.id == task.script_id)
        ).scalar_one()

        scenes = script.content.get("scenes", [])
        if not scenes:
            task.status = "failed"
            task.error_message = "剧本没有场景"
            session.commit()
            return

        upload_dir = Path(settings.UPLOAD_DIR)
        video_dir = upload_dir / "videos"
        video_dir.mkdir(parents=True, exist_ok=True)

        scene_clips: list[Path] = []
        total_scenes = len(scenes)

        for i, scene in enumerate(scenes):
            photo_id = scene.get("photo_id")
            duration = scene.get("duration", 3.0)

            if not photo_id:
                continue

            photo = session.execute(
                select(Photo).where(Photo.id == uuid.UUID(photo_id))
            ).scalar_one_or_none()

            if not photo:
                continue

            photo_path = upload_dir / photo.file_path
            if not photo_path.exists():
                continue

            clip_path = video_dir / f"clip_{task_id}_{i}.mp4"
            _create_clip_from_image(photo_path, clip_path, duration)
            scene_clips.append(clip_path)

            task.progress = int(((i + 1) / total_scenes) * 80)
            session.commit()

        if not scene_clips:
            task.status = "failed"
            task.error_message = "没有有效的场景片段可以合成"
            session.commit()
            return

        output_filename = f"{task_id}.mp4"
        output_path = video_dir / output_filename

        _concat_clips(scene_clips, output_path)

        for clip in scene_clips:
            clip.unlink(missing_ok=True)

        task.status = "completed"
        task.progress = 100
        task.result_video_path = f"videos/{output_filename}"
        task.completed_at = datetime.now(timezone.utc)
        session.commit()

    except Exception as exc:
        logger.exception("Video generation failed for task %s", task_id)
        task = session.execute(
            select(VideoTask).where(VideoTask.id == uuid.UUID(task_id))
        ).scalar_one_or_none()
        if task:
            if _is_retryable(exc):
                task.status = "pending"
                session.commit()
                raise self.retry(countdown=60, exc=exc)
            task.status = "failed"
            task.error_message = str(exc)[:500]
            session.commit()
    finally:
        session.close()


def _create_clip_from_image(image_path: Path, output_path: Path, duration: float) -> None:
    """Use FFmpeg to create a video clip from a still image with Ken Burns effect."""
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(image_path),
        "-c:v", "libx264",
        "-t", str(duration),
        "-pix_fmt", "yuv420p",
        "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.001,1.3)':d={int(duration * 25)}:s=1920x1080",
        "-r", "25",
        str(output_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True, timeout=120)


def _concat_clips(clips: list[Path], output_path: Path) -> None:
    """Concatenate video clips using FFmpeg concat demuxer."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        for clip in clips:
            f.write(f"file '{clip}'\n")
        filelist = f.name

    try:
        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", filelist,
            "-c", "copy",
            str(output_path),
        ]
        subprocess.run(cmd, check=True, capture_output=True, timeout=600)
    finally:
        Path(filelist).unlink(missing_ok=True)


def _is_retryable(exc: Exception) -> bool:
    retryable_errors = ("timeout", "connection", "temporary")
    return any(keyword in str(exc).lower() for keyword in retryable_errors)
