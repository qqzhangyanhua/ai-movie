"""FFmpeg video composition with audio mixing pipeline.

Builds FFmpeg command to:
1. Concatenate image-based clips into a video stream
2. Overlay voiceover audio track (dialogue)
3. Mix in background music at reduced volume
4. Burn subtitles if provided
5. Balance audio levels between voiceover and BGM
"""

import logging
import os
import subprocess
import tempfile

logger = logging.getLogger(__name__)


def _probe_duration(file_path: str) -> float | None:
    """Get media file duration in seconds using ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                file_path,
            ],
            capture_output=True, text=True, timeout=10,
        )
        return float(result.stdout.strip()) if result.stdout.strip() else None
    except Exception as e:
        logger.warning("ffprobe failed for %s: %s", file_path, e)
        return None


def _build_concat_filter(clips: list[dict]) -> tuple[str, str]:
    """Build FFmpeg concat demuxer file content from clip list.

    Each clip dict: {"imageUrl": str, "duration": int}
    Returns (concat_file_content, temp_file_path).
    """
    lines = ["ffconcat version 1.0"]
    for clip in clips:
        image_path = clip.get("imageUrl", "")
        duration = clip.get("duration", 5)
        if image_path and os.path.exists(image_path):
            lines.append(f"file '{image_path}'")
            lines.append(f"duration {duration}")
    if clips:
        last_image = clips[-1].get("imageUrl", "")
        if last_image and os.path.exists(last_image):
            lines.append(f"file '{last_image}'")

    fd, path = tempfile.mkstemp(suffix=".txt", prefix="ffconcat_")
    with os.fdopen(fd, "w") as f:
        f.write("\n".join(lines))
    return "\n".join(lines), path


def compose_video(
    clips: list[dict],
    bgm_url: str | None,
    voiceover_url: str | None,
    subtitle_url: str | None,
    output_path: str,
) -> str:
    """Compose final video with audio mixing pipeline.

    Pipeline stages:
    1. Concat clips → base video (no audio)
    2. Add voiceover as primary audio track
    3. Mix BGM at 0.3 volume under voiceover
    4. Burn subtitles overlay

    Args:
        clips: List of clip dicts with imageUrl and duration.
        bgm_url: Path to background music file, or None.
        voiceover_url: Path to voiceover audio file, or None.
        subtitle_url: Path to SRT subtitle file, or None.
        output_path: Destination path for the final video.

    Returns:
        The output_path on success, or output_path even on failure
        (caller should check if file exists).
    """
    if not clips:
        logger.warning("No clips provided, skipping composition")
        return output_path

    has_local_clips = any(
        os.path.exists(c.get("imageUrl", "")) for c in clips
    )
    if not has_local_clips:
        logger.info("No local clip files found, returning stub output")
        return output_path

    _, concat_path = _build_concat_filter(clips)

    try:
        cmd = ["ffmpeg", "-y"]
        inputs = ["-f", "concat", "-safe", "0", "-i", concat_path]
        filter_parts: list[str] = []
        audio_inputs: list[str] = []
        input_idx = 1

        has_voiceover = voiceover_url and os.path.exists(voiceover_url)
        has_bgm = bgm_url and os.path.exists(bgm_url)

        if has_voiceover:
            inputs.extend(["-i", voiceover_url])
            audio_inputs.append(f"[{input_idx}:a]")
            voiceover_idx = input_idx
            input_idx += 1

        if has_bgm:
            inputs.extend(["-i", bgm_url])
            audio_inputs.append(f"[{input_idx}:a]")
            bgm_idx = input_idx
            input_idx += 1

        video_filter = "[0:v]"
        if subtitle_url and os.path.exists(subtitle_url):
            escaped = subtitle_url.replace("\\", "\\\\").replace(":", "\\:")
            filter_parts.append(
                f"[0:v]subtitles='{escaped}':force_style="
                "'FontSize=24,PrimaryColour=&HFFFFFF&,Outline=2,"
                f"OutlineColour=&H000000&'[vout]"
            )
            video_filter = "[vout]"

        if has_voiceover and has_bgm:
            filter_parts.append(
                f"[{voiceover_idx}:a]volume=1.0[voice];"
                f"[{bgm_idx}:a]volume=0.3[bgm];"
                "[voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            )
            audio_map = "[aout]"
        elif has_voiceover:
            audio_map = f"{voiceover_idx}:a"
        elif has_bgm:
            filter_parts.append(f"[{bgm_idx}:a]volume=0.5[aout]")
            audio_map = "[aout]"
        else:
            audio_map = None

        cmd.extend(inputs)

        if filter_parts:
            cmd.extend(["-filter_complex", ";".join(filter_parts)])

        cmd.extend(["-map", video_filter.strip("[]") if "[" not in video_filter else video_filter])

        if audio_map:
            if audio_map.startswith("["):
                cmd.extend(["-map", audio_map])
            else:
                cmd.extend(["-map", audio_map])

        cmd.extend([
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
        ])

        if audio_map:
            cmd.extend(["-c:a", "aac", "-b:a", "192k"])

        cmd.extend(["-movflags", "+faststart", output_path])

        logger.info("Running FFmpeg: %s", " ".join(cmd))
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=300,
        )

        if result.returncode != 0:
            logger.error("FFmpeg failed (code %d): %s", result.returncode, result.stderr[-500:])
        else:
            logger.info("Video composed successfully: %s", output_path)

    except subprocess.TimeoutExpired:
        logger.error("FFmpeg timed out after 300s")
    except Exception as e:
        logger.exception("Video composition error: %s", e)
    finally:
        try:
            os.unlink(concat_path)
        except OSError:
            pass

    return output_path
