"""Character services for photo-driven role generation."""

import base64
import json
import logging
import mimetypes
import os
from openai import OpenAI

from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)


def _fallback_character(name_hint: str, photo_url: str) -> dict:
    base_name = name_hint.strip() or "角色"
    return {
        "name": base_name,
        "personality": "根据上传照片自动生成的角色，适合作为影片主角。",
        "style": f"参考照片 {os.path.basename(photo_url) or base_name} 的外观特征。",
    }


def _photo_url_to_local_path(photo_url: str) -> str | None:
    if not photo_url or not photo_url.startswith("/"):
        return None

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    candidate = os.path.join(repo_root, "public", photo_url.lstrip("/").replace("/", os.sep))
    return candidate if os.path.exists(candidate) else None


def _local_image_to_data_url(file_path: str) -> str | None:
    try:
        mime_type = mimetypes.guess_type(file_path)[0] or "image/jpeg"
        with open(file_path, "rb") as image_file:
            encoded = base64.b64encode(image_file.read()).decode()
        return f"data:{mime_type};base64,{encoded}"
    except Exception as e:
        logger.error("Failed to encode image %s: %s", file_path, e)
        return None


def describe_character_from_photo(
    photo_url: str,
    name_hint: str,
    project_context: str = "",
) -> dict:
    """Infer character summary from a local photo with OpenAI Vision.

    Returns a dict with name/personality/style. Falls back to generic values
    when OPENAI_API_KEY is unavailable or the image cannot be parsed.
    """
    fallback = _fallback_character(name_hint, photo_url)
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set, using fallback character profile")
        return fallback

    local_path = _photo_url_to_local_path(photo_url)
    if not local_path:
        logger.warning("Photo %s is not accessible locally, using fallback character profile", photo_url)
        return fallback

    data_url = _local_image_to_data_url(local_path)
    if not data_url:
        return fallback

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "你是电影角色设定助手。请根据图片推断一个适合视频生成的角色摘要，"
                        "仅输出 JSON，格式为 "
                        '{"name":"角色名","personality":"一句性格描述","style":"一句外观/造型描述"}。'
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                f"项目上下文：{project_context or '无'}\n"
                                f"角色名提示：{name_hint or '角色'}\n"
                                "请生成简洁、可用于剧本和视频提示词的角色设定。"
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url},
                        },
                    ],
                },
            ],
            response_format={"type": "json_object"},
            max_tokens=300,
        )
        content = response.choices[0].message.content
        if not content:
            return fallback

        parsed = json.loads(content)
        return {
            "name": (parsed.get("name") or fallback["name"]).strip()[:50],
            "personality": (parsed.get("personality") or fallback["personality"]).strip()[:200],
            "style": (parsed.get("style") or fallback["style"]).strip()[:200],
        }
    except Exception as e:
        logger.error("Character photo analysis failed for %s: %s", photo_url, e)
        return fallback


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


def generate_character_embedding(
    name: str, personality: str, style: str
) -> bytes | None:
    """Generate embedding vector for a character using OpenAI Embeddings API.

    Args:
        name: Character name.
        personality: Character personality description.
        style: Character style description.

    Returns:
        Embedding vector as bytes (JSON-encoded list of floats), or None on failure.
    """
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set, skipping character embedding generation")
        return None
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        text = f"角色: {name}, 性格: {personality}, 风格: {style}"
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        vector = response.data[0].embedding
        return json.dumps(vector).encode()
    except Exception as e:
        logger.error("Character embedding generation failed for %s: %s", name, e)
        return None
