"""Subtitle generation service - creates SRT files from script dialogues."""

import logging
import os

logger = logging.getLogger(__name__)


def _format_time(seconds: float) -> str:
    """Format seconds to SRT timestamp: HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def generate_srt(scenes: list[dict], output_path: str) -> str:
    """Generate SRT subtitle file from script scenes.

    Each scene's dialogue becomes a subtitle entry, timed to the scene's position.
    """
    entries = []
    current_time = 0.0
    counter = 1

    for scene in scenes:
        dialogue = (scene.get("dialogue") or "").strip()
        duration = scene.get("duration", 5)

        if dialogue:
            start_time = current_time + 0.5  # slight delay
            end_time = current_time + duration - 0.5

            entries.append(
                f"{counter}\n"
                f"{_format_time(start_time)} --> {_format_time(end_time)}\n"
                f"{dialogue}\n"
            )
            counter += 1

        current_time += duration

    srt_content = "\n".join(entries)

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

    logger.info("Generated SRT with %d entries at %s", len(entries), output_path)
    return output_path
