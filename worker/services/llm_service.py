"""LLM service for structured script generation using OpenAI."""

import json
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """你是一位专业的微电影编剧。根据用户描述和角色信息，生成一个结构化的微电影剧本。

要求：
1. 剧本包含 3-5 个场景
2. 每个场景包含：场景编号、场景描述、角色动作、镜头类型（远景/中景/特写）、时长（4-8秒）、对白（可选）
3. 剧情要有起承转合
4. 角色行为要符合设定的性格特征
5. 总时长控制在 20-40 秒

请严格按照以下 JSON 格式返回，不要包含任何其他文字：
{
  "title": "微电影标题",
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "场景描述",
      "action": "角色动作",
      "cameraType": "远景|中景|特写",
      "duration": 5,
      "dialogue": "对白内容（可选）"
    }
  ]
}"""


def generate_script(prompt: str, characters: list[dict], llm_config: dict | None = None) -> dict:
    """Generate a structured script using LLM API.

    Args:
        prompt: User's script description
        characters: List of character info dicts
        llm_config: LLM configuration from service config (optional)

    Falls back to mock data if config is not provided or call fails.
    """
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

        char_descriptions = []
        for c in characters:
            name = c.get("name", "角色")
            personality = c.get("personality", "")
            style = c.get("style", "")
            desc = f"- {name}"
            if personality:
                desc += f"，性格：{personality}"
            if style:
                desc += f"，风格：{style}"
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
            scene.setdefault("action", "")
            scene.setdefault("cameraType", "中景")
            scene.setdefault("duration", 5)

        return result

    except Exception as e:
        logger.error("LLM generation failed: %s", e)
        return _mock_script(prompt, characters)


def _mock_script(prompt: str, characters: list[dict]) -> dict:
    """Generate a mock script when LLM is unavailable."""
    char_names = [c.get("name", "主角") for c in characters] if characters else ["主角"]
    main_char = char_names[0]

    return {
        "title": prompt[:20] if prompt else "AI 微电影",
        "scenes": [
            {
                "sceneNumber": 1,
                "description": "清晨的城市街道，阳光洒下",
                "action": f"{main_char}走在街道上，若有所思",
                "cameraType": "远景",
                "duration": 5,
                "dialogue": "",
            },
            {
                "sceneNumber": 2,
                "description": "咖啡厅内，温暖的灯光",
                "action": f"{main_char}坐在窗边，翻看手机",
                "cameraType": "中景",
                "duration": 5,
                "dialogue": "也许，是时候做出改变了。",
            },
            {
                "sceneNumber": 3,
                "description": "夕阳下的天台",
                "action": f"{main_char}站在天台边缘，微笑望向远方",
                "cameraType": "特写",
                "duration": 6,
                "dialogue": "",
            },
        ],
    }
