"""LLM service for structured script generation using OpenAI."""

import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是一位专业的微电影编剧。请根据用户描述和角色信息，生成一个结构化的微电影剧本。

要求：
1. 剧本包含 3-5 个场景。
2. 每个场景必须包含：sceneNumber、description、characters、action、cameraType、duration、dialogue。
3. characters 必须是字符串数组，只能填写当前已提供的角色名；如果场景只有一个角色，也要返回单元素数组。
4. 剧情要有起承转合，角色行为要符合设定的性格和外观描述。
5. 总时长控制在 20-40 秒之间。

请严格返回 JSON，不要输出任何额外文本：
{
  "title": "微电影标题",
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "场景描述",
      "characters": ["角色A"],
      "action": "角色动作",
      "cameraType": "远景|中景|特写",
      "duration": 5,
      "dialogue": "对白内容"
    }
  ]
}"""


def generate_script(prompt: str, characters: list[dict], llm_config: dict | None = None) -> dict:
    """Generate a structured script using LLM API."""
    if not llm_config or not llm_config.get("apiKey"):
        logger.warning("LLM config not provided, using mock script")
        return _mock_script(prompt, characters)

    try:
        api_key = llm_config["apiKey"]
        base_url = llm_config.get("baseUrl")
        model = llm_config.get("model", "gpt-4o-mini")
        config = llm_config.get("config", {})
        temperature = config.get("temperature", 0.8)
        max_tokens = config.get("maxTokens", 2000)

        client_kwargs = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url

        client = OpenAI(**client_kwargs)

        available_names = [c.get("name", "角色") for c in characters if c.get("name")]
        char_descriptions = []
        for character in characters:
            name = character.get("name", "角色")
            personality = character.get("personality", "")
            style = character.get("style", "")
            desc = f"- {name}"
            if personality:
                desc += f"，性格：{personality}"
            if style:
                desc += f"，外观：{style}"
            char_descriptions.append(desc)

        user_msg = (
            f"用户描述：{prompt}\n\n角色信息：\n" + "\n".join(char_descriptions)
            if char_descriptions
            else f"用户描述：{prompt}"
        )

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty response from LLM")

        result = json.loads(content)
        if "scenes" not in result or not isinstance(result["scenes"], list):
            raise ValueError("Invalid script structure")

        for scene in result["scenes"]:
            scene.setdefault("sceneNumber", 1)
            scene.setdefault("description", "")
            scene["characters"] = _normalize_scene_characters(
                scene.get("characters"),
                available_names,
            )
            scene.setdefault("action", "")
            scene.setdefault("cameraType", "中景")
            scene.setdefault("duration", 5)
            scene.setdefault("dialogue", "")

        return result
    except Exception as error:
        logger.error("LLM generation failed: %s", error)
        return _mock_script(prompt, characters)


def _mock_script(prompt: str, characters: list[dict]) -> dict:
    """Generate a mock script when LLM is unavailable."""
    char_names = [c.get("name", "主角") for c in characters if c.get("name")] or ["主角"]
    main_char = char_names[0]
    support_char = char_names[1] if len(char_names) > 1 else main_char

    second_scene_characters = (
        [main_char, support_char] if support_char != main_char else [main_char]
    )

    return {
        "title": prompt[:20] if prompt else "AI 微电影",
        "scenes": [
            {
                "sceneNumber": 1,
                "description": "清晨的城市街道，阳光洒下。",
                "characters": [main_char],
                "action": f"{main_char}走在街道上，若有所思。",
                "cameraType": "远景",
                "duration": 5,
                "dialogue": "",
            },
            {
                "sceneNumber": 2,
                "description": "咖啡厅内，温暖的灯光映在桌面。",
                "characters": second_scene_characters,
                "action": f"{main_char}坐在窗边，与身旁的人交换目光。",
                "cameraType": "中景",
                "duration": 5,
                "dialogue": "也许，是时候做出改变了。",
            },
            {
                "sceneNumber": 3,
                "description": "夕阳下的天台，风吹动衣角。",
                "characters": [main_char],
                "action": f"{main_char}站在天台边缘，微笑望向远方。",
                "cameraType": "特写",
                "duration": 6,
                "dialogue": "",
            },
        ],
    }


def _normalize_scene_characters(raw_characters, available_names: list[str]) -> list[str]:
    if isinstance(raw_characters, list):
        cleaned = [str(name).strip() for name in raw_characters if str(name).strip()]
        if cleaned:
            return cleaned

    if available_names:
        return [available_names[0]]

    return ["主角"]
