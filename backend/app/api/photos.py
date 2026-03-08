import uuid
from io import BytesIO
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, HTTPException, UploadFile, status
from PIL import Image
from sqlalchemy import select, func

from app.core.config import settings
from app.core.deps import CurrentUser, DbSession
from app.models.photo import Photo
from app.models.project import Project
from app.schemas.photo import PhotoResponse, PhotoReorderRequest
from app.services.storage import get_storage_provider

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
THUMBNAIL_SIZE = (300, 300)


async def _verify_project_access(project_id: UUID, user_id: UUID, db: DbSession) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project


@router.get("", response_model=list[PhotoResponse])
async def list_photos(
    project_id: UUID, current_user: CurrentUser, db: DbSession
) -> list[Photo]:
    await _verify_project_access(project_id, current_user.id, db)
    result = await db.execute(
        select(Photo)
        .where(Photo.project_id == project_id)
        .order_by(Photo.order_index)
    )
    return list(result.scalars().all())


@router.post("", response_model=list[PhotoResponse], status_code=status.HTTP_201_CREATED)
async def upload_photos(
    project_id: UUID,
    files: list[UploadFile],
    current_user: CurrentUser,
    db: DbSession,
) -> list[Photo]:
    await _verify_project_access(project_id, current_user.id, db)

    existing_count_result = await db.execute(
        select(func.count()).where(Photo.project_id == project_id)
    )
    existing_count = existing_count_result.scalar() or 0

    if existing_count + len(files) > settings.MAX_PHOTOS_PER_PROJECT:
        raise HTTPException(
            status_code=400,
            detail=f"超出项目照片限制（最多{settings.MAX_PHOTOS_PER_PROJECT}张）",
        )

    storage = get_storage_provider(
        provider=settings.STORAGE_PROVIDER,
        upload_dir=settings.UPLOAD_DIR,
        s3_bucket=settings.S3_BUCKET,
        s3_region=settings.S3_REGION,
        s3_access_key=settings.S3_ACCESS_KEY,
        s3_secret_key=settings.S3_SECRET_KEY,
    )

    created_photos: list[Photo] = []

    for i, file in enumerate(files):
        if not file.filename:
            continue

        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"不支持的文件格式: {ext}")

        content = await file.read()
        file_size = len(content)
        if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"文件 {file.filename} 超出大小限制（最大{settings.MAX_FILE_SIZE_MB}MB）",
            )

        file_uuid = str(uuid.uuid4())
        photo_key = f"photos/{file_uuid}{ext}"
        thumb_key = f"thumbnails/{file_uuid}_thumb{ext}"

        img = Image.open(BytesIO(content))
        width, height = img.size

        file_url = await storage.upload(content, photo_key)

        img.thumbnail(THUMBNAIL_SIZE)
        thumb_buffer = BytesIO()
        img.save(thumb_buffer, format=img.format or "JPEG")
        thumb_url = await storage.upload(thumb_buffer.getvalue(), thumb_key)

        photo = Photo(
            project_id=project_id,
            file_path=photo_key,
            file_url=file_url,
            thumbnail_path=thumb_key,
            thumb_url=thumb_url,
            storage_key=photo_key,
            storage_type=settings.STORAGE_PROVIDER,
            file_size=file_size,
            width=width,
            height=height,
            order_index=existing_count + i,
        )
        db.add(photo)
        created_photos.append(photo)

    await db.flush()
    for p in created_photos:
        await db.refresh(p)

    return created_photos


@router.delete("/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_photo(
    project_id: UUID, photo_id: UUID, current_user: CurrentUser, db: DbSession
) -> None:
    await _verify_project_access(project_id, current_user.id, db)

    result = await db.execute(
        select(Photo).where(Photo.id == photo_id, Photo.project_id == project_id)
    )
    photo = result.scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="照片不存在")

    storage = get_storage_provider(
        provider=settings.STORAGE_PROVIDER,
        upload_dir=settings.UPLOAD_DIR,
        s3_bucket=settings.S3_BUCKET,
        s3_region=settings.S3_REGION,
        s3_access_key=settings.S3_ACCESS_KEY,
        s3_secret_key=settings.S3_SECRET_KEY,
    )

    if photo.storage_key:
        await storage.delete(photo.storage_key)
    if photo.thumbnail_path:
        await storage.delete(photo.thumbnail_path)

    await db.delete(photo)


@router.put("/reorder", status_code=status.HTTP_200_OK)
async def reorder_photos(
    project_id: UUID,
    payload: PhotoReorderRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, str]:
    await _verify_project_access(project_id, current_user.id, db)

    result = await db.execute(
        select(Photo).where(Photo.project_id == project_id)
    )
    photos_map = {p.id: p for p in result.scalars().all()}

    for idx, photo_id in enumerate(payload.photo_ids):
        if photo_id in photos_map:
            photos_map[photo_id].order_index = idx

    return {"status": "ok"}
