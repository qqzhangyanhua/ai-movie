from uuid import UUID
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ScriptCreate(BaseModel):
    project_id: UUID | None = None
    title: str
    content: dict[str, Any] = {"scenes": [], "metadata": {"total_duration": 0, "bgm": None}}
    description: str | None = None


class ScriptUpdate(BaseModel):
    title: str | None = None
    content: dict[str, Any] | None = None
    description: str | None = None


class ScriptResponse(BaseModel):
    id: UUID
    project_id: UUID | None
    user_id: UUID
    title: str
    content: dict[str, Any]
    description: str | None
    is_template: bool
    is_public: bool
    source_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CloneTemplateRequest(BaseModel):
    project_id: UUID


class GenerateScriptRequest(BaseModel):
    project_id: UUID
    description: str
    photo_ids: list[UUID] | None = None
    ai_config_id: UUID
