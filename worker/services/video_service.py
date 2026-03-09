"""Video generation service supporting multiple providers."""

import logging
import time
import requests
from typing import Optional

logger = logging.getLogger(__name__)


def generate_video_clip(
    scene: dict,
    characters: list[dict],
    video_gen_config: dict,
) -> Optional[str]:
    """Generate video clip from scene description.

    Args:
        scene: Scene data with description, action, cameraType, duration
        characters: List of character info
        video_gen_config: Video generation service config

    Returns:
        Video URL or None if generation failed
    """
    provider = video_gen_config.get("provider", "").lower()

    if "runway" in provider:
        return _generate_runway(scene, characters, video_gen_config)
    elif "luma" in provider:
        return _generate_luma(scene, characters, video_gen_config)
    elif "pika" in provider:
        return _generate_pika(scene, characters, video_gen_config)
    else:
        logger.warning(f"Unknown provider: {provider}, using mock")
        return _generate_mock(scene)


def _generate_runway(scene: dict, characters: list[dict], config: dict) -> Optional[str]:
    """Generate video using Runway Gen-3 API."""
    api_key = config.get("apiKey")
    base_url = config.get("baseUrl", "https://api.runwayml.com/v1")
    model = config.get("model", "gen3a_turbo")

    if not api_key:
        logger.error("Runway API key not configured")
        return _generate_mock(scene)

    try:
        prompt = _build_prompt(scene, characters)
        duration = scene.get("duration", 5)

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": model,
            "prompt": prompt,
            "duration": duration,
        }

        response = requests.post(
            f"{base_url}/generations",
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()

        task_id = response.json().get("id")
        if not task_id:
            raise ValueError("No task ID returned")

        video_url = _poll_runway_task(task_id, api_key, base_url)
        return video_url

    except Exception as e:
        logger.error(f"Runway generation failed: {e}")
        return _generate_mock(scene)


def _poll_runway_task(task_id: str, api_key: str, base_url: str, max_wait: int = 600) -> Optional[str]:
    """Poll Runway task until completion."""
    headers = {"Authorization": f"Bearer {api_key}"}
    start_time = time.time()

    while time.time() - start_time < max_wait:
        try:
            response = requests.get(
                f"{base_url}/generations/{task_id}",
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            status = data.get("status")
            if status == "succeeded":
                return data.get("output", {}).get("url")
            elif status in ["failed", "cancelled"]:
                logger.error(f"Runway task {task_id} {status}")
                return None

            time.sleep(5)

        except Exception as e:
            logger.error(f"Error polling Runway task: {e}")
            time.sleep(5)

    logger.error(f"Runway task {task_id} timeout")
    return None


def _generate_luma(scene: dict, characters: list[dict], config: dict) -> Optional[str]:
    """Generate video using Luma Dream Machine API."""
    api_key = config.get("apiKey")
    base_url = config.get("baseUrl", "https://api.lumalabs.ai/v1")

    if not api_key:
        logger.error("Luma API key not configured")
        return _generate_mock(scene)

    try:
        prompt = _build_prompt(scene, characters)

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "prompt": prompt,
        }

        response = requests.post(
            f"{base_url}/generations",
            headers=headers,
            json=payload,
            timeout=30,
        )
        response.raise_for_status()

        task_id = response.json().get("id")
        if not task_id:
            raise ValueError("No task ID returned")

        video_url = _poll_luma_task(task_id, api_key, base_url)
        return video_url

    except Exception as e:
        logger.error(f"Luma generation failed: {e}")
        return _generate_mock(scene)


def _poll_luma_task(task_id: str, api_key: str, base_url: str, max_wait: int = 600) -> Optional[str]:
    """Poll Luma task until completion."""
    headers = {"Authorization": f"Bearer {api_key}"}
    start_time = time.time()

    while time.time() - start_time < max_wait:
        try:
            response = requests.get(
                f"{base_url}/generations/{task_id}",
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            status = data.get("state")
            if status == "completed":
                return data.get("assets", {}).get("video")
            elif status == "failed":
                logger.error(f"Luma task {task_id} failed")
                return None

            time.sleep(5)

        except Exception as e:
            logger.error(f"Error polling Luma task: {e}")
            time.sleep(5)

    logger.error(f"Luma task {task_id} timeout")
    return None


def _generate_pika(scene: dict, characters: list[dict], config: dict) -> Optional[str]:
    """Generate video using Pika API."""
    logger.warning("Pika API not yet implemented, using mock")
    return _generate_mock(scene)


def _build_prompt(scene: dict, characters: list[dict]) -> str:
    """Build video generation prompt from scene and characters.

    Uses method B: Include character description in prompt for consistency.
    """
    description = scene.get("description", "")
    action = scene.get("action", "")
    camera_type = scene.get("cameraType", "中景")

    camera_map = {
        "远景": "wide shot",
        "中景": "medium shot",
        "特写": "close-up",
    }
    camera_en = camera_map.get(camera_type, "medium shot")

    char_desc = ""
    if characters:
        char_names = [c.get("name", "character") for c in characters]
        char_desc = f"Characters: {', '.join(char_names)}. "

    prompt = f"{char_desc}{description}. {action}. {camera_en}. Cinematic, high quality."

    return prompt


def _generate_mock(scene: dict) -> str:
    """Generate mock video URL for testing."""
    logger.info(f"Using mock video for scene {scene.get('sceneNumber', 0)}")
    return f"/uploads/mock-video-scene-{scene.get('sceneNumber', 0)}.mp4"

