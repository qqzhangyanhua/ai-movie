"""TTS voiceover service using OpenAI Speech API."""

import logging
import time
from pathlib import Path

from openai import OpenAI

from config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

VALID_VOICES = frozenset({"alloy", "echo", "fable", "onyx", "nova", "shimmer"})


def generate_voiceover(text: str, voice: str = "alloy") -> str | None:
    """Generate TTS audio from text using OpenAI Speech API.

    Args:
        text: Text to convert to speech.
        voice: Voice to use. One of: alloy, echo, fable, onyx, nova, shimmer.

    Returns:
        Path to the generated mp3 file, or None on failure.
    """
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set, skipping voiceover generation")
        return None

    if not text or not str(text).strip():
        logger.warning("Empty text, skipping voiceover")
        return None

    voice = voice.lower() if voice else "alloy"
    if voice not in VALID_VOICES:
        voice = "alloy"
        logger.info("Invalid voice, falling back to alloy")

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        timestamp = int(time.time() * 1000)
        filepath = f"/tmp/voiceover_{timestamp}.mp3"

        response = client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text.strip(),
            response_format="mp3",
        )
        response.stream_to_file(filepath)

        if Path(filepath).exists():
            logger.info("Voiceover saved to %s", filepath)
            return filepath
        logger.error("Voiceover file was not created: %s", filepath)
        return None

    except Exception as e:
        logger.exception("Voiceover generation failed: %s", e)
        return None


def generate_scene_voiceovers(scenes: list[dict]) -> list[dict]:
    """Generate voiceovers for scenes that have dialogue.

    Args:
        scenes: List of scene dicts with 'dialogue' and optional 'voice' keys.
               Scene structure: {"sceneNumber": int, "dialogue": str, "voice": str?}

    Returns:
        List of dicts: [{"sceneNumber": 1, "voiceover_url": "path/to/file.mp3"}, ...]
    """
    results: list[dict] = []
    for i, scene in enumerate(scenes):
        dialogue = (scene.get("dialogue") or "").strip()
        if not dialogue:
            continue
        voice = scene.get("voice", "alloy")
        scene_number = scene.get("sceneNumber", i + 1)
        path = generate_voiceover(dialogue, voice)
        if path:
            results.append({"sceneNumber": scene_number, "voiceover_url": path})
    return results
