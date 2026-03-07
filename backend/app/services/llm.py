import json
import logging
from uuid import uuid4

import httpx

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是一个专业的微电影剧本创作助手。根据用户的描述和照片信息，生成一个结构化的剧本。

你必须严格按照以下JSON格式输出，不要输出任何其他内容：

{
  "scenes": [
    {
      "id": "scene-1",
      "photo_id": "对应照片的ID，如果有的话",
      "duration": 3.0,
      "caption": "场景描述文案",
      "transition": "fade",
      "order": 0
    }
  ],
  "metadata": {
    "total_duration": 15.0,
    "bgm": null
  }
}

规则：
1. 每个场景时长建议2-5秒
2. 转场效果可选：fade, slide, zoom, dissolve, none
3. caption应该简洁有力，适合视频字幕
4. 根据照片数量合理安排场景数
5. 如果提供了照片ID列表，尽量让每张照片出现在至少一个场景中
6. 总时长建议控制在15-60秒
"""


async def generate_script_with_llm(
    description: str,
    photo_ids: list[str],
    photo_count: int,
    provider: str,
    base_url: str | None,
    api_key: str,
    model: str | None,
) -> dict:
    """Call LLM API to generate a structured script."""

    photo_info = f"共有{photo_count}张照片。" if photo_count > 0 else "没有照片。"
    if photo_ids:
        photo_info += f"\n照片ID列表：{json.dumps(photo_ids)}"

    user_message = f"""请根据以下信息创作微电影剧本：

主题描述：{description}

{photo_info}

请生成一个适合这个主题的微电影剧本，包含合理数量的场景。"""

    api_url = _resolve_api_url(provider, base_url)
    model_name = model or _default_model(provider)

    request_body = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    if provider == "claude":
        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        }
        request_body = {
            "model": model_name,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": user_message}],
            "max_tokens": 2000,
        }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(api_url, json=request_body, headers=headers)
        response.raise_for_status()
        data = response.json()

    raw_text = _extract_text(data, provider)
    return _parse_script_json(raw_text, photo_ids)


def _resolve_api_url(provider: str, base_url: str | None) -> str:
    if base_url:
        return base_url.rstrip("/") + "/chat/completions"

    defaults = {
        "openai": "https://api.openai.com/v1/chat/completions",
        "claude": "https://api.anthropic.com/v1/messages",
    }
    return defaults.get(provider, "https://api.openai.com/v1/chat/completions")


def _default_model(provider: str) -> str:
    defaults = {
        "openai": "gpt-4o",
        "claude": "claude-sonnet-4-20250514",
    }
    return defaults.get(provider, "gpt-4o")


def _extract_text(data: dict, provider: str) -> str:
    if provider == "claude":
        return data["content"][0]["text"]
    return data["choices"][0]["message"]["content"]


def _parse_script_json(raw_text: str, photo_ids: list[str]) -> dict:
    """Extract JSON from LLM response, handling markdown code fences."""
    text = raw_text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Failed to parse LLM response, creating fallback script")
        result = _fallback_script(photo_ids)

    for i, scene in enumerate(result.get("scenes", [])):
        if not scene.get("id"):
            scene["id"] = f"scene-{uuid4().hex[:8]}"
        scene["order"] = i

    total = sum(s.get("duration", 3.0) for s in result.get("scenes", []))
    if "metadata" not in result:
        result["metadata"] = {}
    result["metadata"]["total_duration"] = total
    result["metadata"].setdefault("bgm", None)

    return result


def _fallback_script(photo_ids: list[str]) -> dict:
    """Generate a basic fallback script when LLM parsing fails."""
    scenes = []
    for i, pid in enumerate(photo_ids or [""]):
        scenes.append({
            "id": f"scene-{uuid4().hex[:8]}",
            "photo_id": pid,
            "duration": 3.0,
            "caption": f"场景 {i + 1}",
            "transition": "fade",
            "order": i,
        })
    if not scenes:
        scenes.append({
            "id": f"scene-{uuid4().hex[:8]}",
            "photo_id": "",
            "duration": 3.0,
            "caption": "开始你的故事",
            "transition": "fade",
            "order": 0,
        })
    return {
        "scenes": scenes,
        "metadata": {
            "total_duration": sum(s["duration"] for s in scenes),
            "bgm": None,
        },
    }
