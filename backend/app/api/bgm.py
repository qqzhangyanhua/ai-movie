import uuid as uuid_mod
from uuid import UUID
import os
import shutil
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from sqlalchemy import select, or_

from app.core.deps import CurrentUser, DbSession
from app.models.bgm import BgmTrack
from app.schemas.bgm import BgmResponse

router = APIRouter()

UPLOAD_DIR = "uploads/bgm"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("", response_model=list[BgmResponse])
async def list_bgms(
    current_user: CurrentUser,
    db: DbSession,
) -> list[BgmTrack]:
    query = select(BgmTrack).where(
        or_(BgmTrack.is_system.is_(True), BgmTrack.user_id == current_user.id)
    ).order_by(BgmTrack.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.post("", response_model=BgmResponse, status_code=status.HTTP_201_CREATED)
async def upload_bgm(
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
    name: str = Form(...),
    category: str | None = Form(None),
    duration: float = Form(0.0),
) -> BgmTrack:
    if not file.filename:
        raise HTTPException(status_code=400, detail="未上传文件")

    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid_mod.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    db_file_path = f"bgm/{filename}"

    bgm = BgmTrack(
        user_id=current_user.id,
        name=name,
        file_path=db_file_path,
        duration=duration,
        category=category,
        is_system=False,
    )
    db.add(bgm)
    await db.flush()
    await db.refresh(bgm)
    return bgm


@router.delete("/{bgm_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bgm(
    bgm_id: UUID, current_user: CurrentUser, db: DbSession
) -> None:
    result = await db.execute(
        select(BgmTrack).where(BgmTrack.id == bgm_id, BgmTrack.user_id == current_user.id)
    )
    bgm = result.scalar_one_or_none()
    if not bgm:
        raise HTTPException(status_code=404, detail="BGM不存在或无权删除")

    # Optional: Delete file
    file_path = os.path.join("uploads", bgm.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.delete(bgm)
