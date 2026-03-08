from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.core.security import decrypt_api_key
from app.models.project import Project
from app.models.script import Script
from app.models.user_ai_config import UserAiConfig
from app.models.video_task import VideoTask
from app.schemas.video_task import VideoTaskCreate, VideoTaskResponse

router = APIRouter()


@router.post("", response_model=VideoTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_video_task(
    payload: VideoTaskCreate, current_user: CurrentUser, db: DbSession
) -> VideoTask:
    proj_result = await db.execute(
        select(Project).where(
            Project.id == payload.project_id, Project.user_id == current_user.id
        )
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="项目不存在")

    script_result = await db.execute(
        select(Script).where(Script.id == payload.script_id)
    )
    script = script_result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="剧本不存在")

    config_result = await db.execute(
        select(UserAiConfig).where(
            UserAiConfig.id == payload.ai_config_id,
            UserAiConfig.user_id == current_user.id,
        )
    )
    ai_config = config_result.scalar_one_or_none()
    if not ai_config:
        raise HTTPException(status_code=404, detail="AI配置不存在")

    ai_config_data = {
        "provider": ai_config.provider,
        "model": ai_config.model,
    }

    task = VideoTask(
        project_id=payload.project_id,
        script_id=payload.script_id,
        ai_config_id=ai_config.id,
        status="pending",
        ai_config=ai_config_data,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)

    from app.tasks.video import generate_video

    generate_video.delay(str(task.id))

    return task


@router.get("", response_model=list[VideoTaskResponse])
async def list_video_tasks(
    current_user: CurrentUser,
    db: DbSession,
    project_id: UUID | None = Query(None),
) -> list[VideoTask]:
    query = (
        select(VideoTask)
        .join(Project)
        .where(Project.user_id == current_user.id)
    )
    if project_id:
        query = query.where(VideoTask.project_id == project_id)
    result = await db.execute(query.order_by(VideoTask.created_at.desc()))
    return list(result.scalars().all())


@router.get("/{task_id}", response_model=VideoTaskResponse)
async def get_video_task(
    task_id: UUID, current_user: CurrentUser, db: DbSession
) -> VideoTask:
    result = await db.execute(
        select(VideoTask)
        .join(Project)
        .where(VideoTask.id == task_id, Project.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task


@router.post("/{task_id}/cancel", status_code=status.HTTP_200_OK)
async def cancel_video_task(
    task_id: UUID, current_user: CurrentUser, db: DbSession
) -> dict[str, str]:
    result = await db.execute(
        select(VideoTask)
        .join(Project)
        .where(VideoTask.id == task_id, Project.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    if task.status in ("completed", "failed"):
        raise HTTPException(status_code=400, detail="任务已结束")

    task.status = "failed"
    task.error_message = "用户取消"
    return {"status": "cancelled"}


@router.post("/{task_id}/retry", response_model=VideoTaskResponse, status_code=status.HTTP_200_OK)
async def retry_video_task(
    task_id: UUID, current_user: CurrentUser, db: DbSession
) -> VideoTask:
    result = await db.execute(
        select(VideoTask)
        .join(Project)
        .where(VideoTask.id == task_id, Project.user_id == current_user.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    if task.status != "failed":
        raise HTTPException(status_code=400, detail="只有失败的任务才能重试")

    task.status = "pending"
    task.error_message = None
    task.progress = 0
    task.result_video_path = None
    task.completed_at = None
    await db.flush()
    await db.refresh(task)

    from app.tasks.video import generate_video

    generate_video.delay(str(task.id))
    return task
