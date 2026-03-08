"""Character three-view generation service using DALL-E 3."""

import logging
from openai import OpenAI

from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)


def _generate_single_view(
    view_type: str, prompt_suffix: str, name: str
) -> str | None:
    """Generate a single character view. Returns URL or None on failure."""
    if not OPENAI_API_KEY:
        return None
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        prompt = (
            f"角色{view_type}，角色名称：{name}。{prompt_suffix} "
            "风格：电影级画质，角色设计稿风格，保持角色一致性。"
        )
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        return response.data[0].url
    except Exception as e:
        logger.error("Character %s view generation failed: %s", view_type, e)
        return None


def generate_character_views(photo_url: str, name: str) -> dict:
    """Generate front, side, and back views for a character using DALL-E 3.

    Args:
        photo_url: Reference photo URL (used in prompt context; DALL-E 3
            does not fetch URLs, so name/style are primary).
        name: Character name for prompt consistency.

    Returns:
        Dict with keys: front_view_url, side_view_url, back_view_url.
        Each value is str | None. Returns all None when OPENAI_API_KEY is unset.
    """
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set, skipping character view generation")
        return {
            "front_view_url": None,
            "side_view_url": None,
            "back_view_url": None,
        }

    result = {
        "front_view_url": _generate_single_view(
            "正面视图", "正面全身站立，清晰展示面部和身体正面", name
        ),
        "side_view_url": _generate_single_view(
            "侧面视图", "90度侧面全身站立，清晰展示侧面轮廓", name
        ),
        "back_view_url": _generate_single_view(
            "背面视图", "背面全身站立，清晰展示背部轮廓", name
        ),
    }

    success_count = sum(1 for v in result.values() if v is not None)
    logger.info(
        "Character views generated for %s: %d/3 success (photo_url=%s)",
        name,
        success_count,
        photo_url[:50] + "..." if len(photo_url) > 50 else photo_url,
    )
    return result
