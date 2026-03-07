from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class PhotoResponse(BaseModel):
    id: UUID
    project_id: UUID
    file_path: str
    thumbnail_path: str | None
    file_size: int
    width: int
    height: int
    upload_at: datetime
    order_index: int

    model_config = {"from_attributes": True}


class PhotoReorderRequest(BaseModel):
    photo_ids: list[UUID]
