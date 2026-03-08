from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class BgmCreate(BaseModel):
    name: str
    category: str | None = None
    duration: float = 0.0


class BgmResponse(BaseModel):
    id: UUID
    name: str
    file_path: str
    duration: float
    category: str | None
    is_system: bool
    user_id: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
