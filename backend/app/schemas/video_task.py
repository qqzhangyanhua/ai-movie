from uuid import UUID
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class VideoTaskCreate(BaseModel):
    project_id: UUID
    script_id: UUID
    ai_config_id: UUID


class VideoTaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    script_id: UUID
    status: str
    ai_config: dict[str, Any] | None
    result_video_path: str | None
    error_message: str | None
    progress: int | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
