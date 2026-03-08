"""Tests for LLM service."""

from services.llm_service import _mock_script


def test_mock_script_returns_valid_structure():
    result = _mock_script("测试剧本", [{"name": "小明"}])
    assert "title" in result
    assert "scenes" in result
    assert len(result["scenes"]) >= 2
    for scene in result["scenes"]:
        assert "sceneNumber" in scene
        assert "description" in scene
        assert "cameraType" in scene
        assert "duration" in scene


def test_mock_script_uses_character_name():
    result = _mock_script("冒险故事", [{"name": "勇者"}])
    actions = " ".join(s.get("action", "") for s in result["scenes"])
    assert "勇者" in actions


def test_mock_script_empty_characters():
    result = _mock_script("测试", [])
    assert len(result["scenes"]) >= 2
