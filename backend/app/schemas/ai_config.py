from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class AiConfigCreate(BaseModel):
    name: str
    provider: str
    base_url: str | None = None
    api_key: str
    model: str | None = None
    is_default: bool = False


class AiConfigUpdate(BaseModel):
    name: str | None = None
    provider: str | None = None
    base_url: str | None = None
    api_key: str | None = None
    model: str | None = None
    is_default: bool | None = None


class AiConfigResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    provider: str
    base_url: str | None
    model: str | None
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}
