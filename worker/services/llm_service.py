"""LLM service stub."""


def generate_script(prompt: str, characters: list) -> dict:
    """Generate script from prompt and characters. Stub returns mock structure."""
    return {
        "scenes": [
            {"sceneNumber": 1, "description": "开场", "duration": 5},
            {"sceneNumber": 2, "description": "发展", "duration": 5},
            {"sceneNumber": 3, "description": "高潮", "duration": 5},
            {"sceneNumber": 4, "description": "结局", "duration": 5},
        ]
    }
