"""Poster generation service for movie posters using DALL-E 3."""

import logging
from openai import OpenAI

from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)


def generate_poster(
    title: str,
    description: str,
    style: str = "",
    key_scene: str = "",
) -> str | None:
    """Generate a movie poster using DALL-E 3.

    Args:
        title: Movie title.
        description: Movie description.
        style: Optional style hint (e.g. "科幻", "文艺").
        key_scene: Optional key scene description for visual reference.

    Returns:
        Image URL or None if generation fails.
    """
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set, skipping poster generation")
        return None

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)

        style_part = f"风格：专业电影海报，{style}，" if style else "风格：专业电影海报，"
        key_scene_part = f"{key_scene}。" if key_scene else ""

        prompt = (
            f"电影海报设计，标题：{title}。{description}。{key_scene_part}"
            f"{style_part}高质量，4K分辨率，"
            "包含电影标题文字，戏剧性光影效果，海报构图。"
        )

        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1792",
            quality="hd",
            n=1,
        )

        return response.data[0].url

    except Exception as e:
        logger.error("Poster generation failed: %s", e)
        return None
