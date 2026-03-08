"""Image generation service for storyboard previews."""

import logging
from openai import OpenAI

from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)


def generate_storyboard_preview(
    description: str, camera_type: str, action: str
) -> str | None:
    """Generate a preview image for a storyboard scene using DALL-E.

    Returns the image URL or None if generation fails.
    """
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set, skipping image generation")
        return None

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)

        prompt = (
            f"电影场景分镜图，{camera_type}镜头：{description}。{action}。"
            "风格：电影级画质，专业分镜板风格。"
        )

        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1792x1024",
            quality="standard",
            n=1,
        )

        return response.data[0].url

    except Exception as e:
        logger.error("Image generation failed: %s", e)
        return None
