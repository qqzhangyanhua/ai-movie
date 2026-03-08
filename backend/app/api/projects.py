from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import aliased

from app.core.deps import CurrentUser, DbSession
from app.models.project import Project
from app.models.video_task import VideoTask
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()


@router.get("", response_model=list[ProjectResponse])
async def list_projects(current_user: CurrentUser, db: DbSession) -> list[dict]:
    # Correlated subquery: latest video task status per project
    latest_task_subq = (
        select(VideoTask.status)
        .where(VideoTask.project_id == Project.id)
        .order_by(VideoTask.created_at.desc())
        .limit(1)
        .correlate(Project)
        .scalar_subquery()
    )
    result = await db.execute(
        select(Project, latest_task_subq.label("latest_video_status"))
        .where(Project.user_id == current_user.id)
        .order_by(Project.updated_at.desc())
    )
    rows = result.all()
    projects = []
    for project, latest_status in rows:
        item = ProjectResponse.model_validate(project)
        item.latest_video_status = latest_status
        projects.append(item)
    return projects



@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate, current_user: CurrentUser, db: DbSession
) -> Project:
    project = Project(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID, current_user: CurrentUser, db: DbSession
) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID, payload: ProjectUpdate, current_user: CurrentUser, db: DbSession
) -> Project:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description

    await db.flush()
    await db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID, current_user: CurrentUser, db: DbSession
) -> None:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")
    await db.delete(project)
