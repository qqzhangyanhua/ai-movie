from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: str | None
    latest_video_status: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
