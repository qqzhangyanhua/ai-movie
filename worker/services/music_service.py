"""AI music generation service using Suno API or mock fallback."""

import logging
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import json

from config import SUNO_API_KEY

logger = logging.getLogger(__name__)

MOOD_KEYWORDS = {
    "温暖": ["温暖", "阳光", "微笑", "幸福", "甜蜜"],
    "紧张": ["紧张", "追逐", "危险", "冲突", "黑暗"],
    "悲伤": ["悲伤", "离别", "眼泪", "孤独", "雨"],
    "欢快": ["欢快", "庆祝", "派对", "跳舞", "笑"],
    "神秘": ["神秘", "未知", "探索", "迷雾", "夜晚"],
}

DEFAULT_MOOD = "温暖"


def _infer_mood_from_text(text: str) -> str:
    """Infer mood from scene description text based on keywords."""
    if not text or not isinstance(text, str):
        return DEFAULT_MOOD
    text_lower = text.strip().lower()
    scores: dict[str, int] = {}
    for mood, keywords in MOOD_KEYWORDS.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        if count > 0:
            scores[mood] = scores.get(mood, 0) + count
    if scores:
        return max(scores, key=scores.get)
    return DEFAULT_MOOD


def generate_bgm(mood: str, duration: int, style: str = "") -> str | None:
    """Generate BGM via Suno API or return None if not configured.

    Args:
        mood: Scene mood label, e.g. "温暖", "紧张", "悲伤", "欢快", "神秘"
        duration: Desired duration in seconds
        style: Music style, e.g. "钢琴", "电子", "交响乐"

    Returns:
        URL of generated music, or None on failure or when SUNO_API_KEY is not set.
    """
    if not SUNO_API_KEY:
        logger.warning("SUNO_API_KEY not configured, skipping BGM generation")
        return None

    prompt = f"{mood}风格的{style or '纯音乐'}背景音乐，时长{duration}秒"
    body = {"prompt": prompt, "duration": duration}
    url = "https://api.suno.ai/v1/generation"

    try:
        req = Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {SUNO_API_KEY}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
        music_url = None
        if isinstance(data, dict):
            music_url = data.get("url") or data.get("audio_url") or data.get("music_url")
        if isinstance(data, dict) and "data" in data:
            items = data.get("data")
            if isinstance(items, list) and items:
                first = items[0]
                if isinstance(first, dict):
                    music_url = first.get("url") or first.get("audio_url") or music_url
        if music_url:
            logger.info("BGM generated: %s", music_url)
            return str(music_url)
        logger.warning("Suno API response missing music URL: %s", data)
        return None
    except HTTPError as e:
        logger.error("Suno API HTTP error %s: %s", e.code, e.reason)
        return None
    except URLError as e:
        logger.error("Suno API request failed: %s", e.reason)
        return None
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.exception("Suno API response parse error: %s", e)
        return None
    except Exception as e:
        logger.exception("BGM generation failed: %s", e)
        return None


def generate_project_bgm(scenes: list[dict], total_duration: int) -> str | None:
    """Analyze scenes to infer overall mood and generate project-level BGM.

    Args:
        scenes: List of scene dicts with 'description', 'action', etc.
        total_duration: Total video duration in seconds.

    Returns:
        BGM URL or None.
    """
    if not scenes:
        return generate_bgm(DEFAULT_MOOD, total_duration, "")

    combined_text = ""
    for s in scenes:
        if isinstance(s, dict):
            combined_text += (s.get("description") or "") + (s.get("action") or "")
    mood = _infer_mood_from_text(combined_text)

    style = ""
    for s in scenes:
        if isinstance(s, dict) and s.get("style"):
            style = str(s.get("style", ""))
            break

    return generate_bgm(mood, total_duration, style)
