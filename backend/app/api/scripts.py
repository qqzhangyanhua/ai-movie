import uuid as uuid_mod
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, or_

from app.core.deps import CurrentUser, DbSession
from app.core.security import decrypt_api_key
from app.models.photo import Photo
from app.models.script import Script
from app.models.project import Project
from app.models.user_ai_config import UserAiConfig
from app.schemas.script import (
    ScriptCreate,
    ScriptUpdate,
    ScriptResponse,
    CloneTemplateRequest,
    GenerateScriptRequest,
)
from app.services.llm import generate_script_with_llm

router = APIRouter()


@router.get("", response_model=list[ScriptResponse])
async def list_scripts(
    current_user: CurrentUser,
    db: DbSession,
    project_id: UUID | None = Query(None),
) -> list[Script]:
    query = select(Script).where(Script.user_id == current_user.id)
    if project_id:
        query = query.where(Script.project_id == project_id)
    query = query.order_by(Script.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/templates", response_model=list[ScriptResponse])
async def list_templates(
    current_user: CurrentUser,
    db: DbSession,
    source_type: str | None = Query(None),
    search: str | None = Query(None),
) -> list[Script]:
    query = select(Script).where(
        Script.is_template.is_(True),
        or_(Script.user_id == current_user.id, Script.source_type == "system"),
    )
    if source_type:
        query = query.where(Script.source_type == source_type)
    if search:
        query = query.where(Script.title.ilike(f"%{search}%"))
    result = await db.execute(query.order_by(Script.created_at.desc()))
    return list(result.scalars().all())


@router.get("/community", response_model=list[ScriptResponse])
async def list_community_templates(
    db: DbSession,
    search: str | None = Query(None),
    category: str | None = Query(None),
    sort_by: str | None = Query(None),  # newest / popular
) -> list[Script]:
    query = select(Script).where(Script.is_public.is_(True), Script.is_template.is_(True))
    if search:
        query = query.where(Script.title.ilike(f"%{search}%"))
    if category:
        query = query.where(Script.category == category)
    if sort_by == "popular":
        query = query.order_by(Script.clone_count.desc(), Script.created_at.desc())
    else:
        query = query.order_by(Script.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(
    script_id: UUID, current_user: CurrentUser, db: DbSession
) -> Script:
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="剧本不存在")
    if script.user_id != current_user.id and not script.is_public and script.source_type != "system":
        raise HTTPException(status_code=403, detail="无权访问")
    return script


@router.post("", response_model=ScriptResponse, status_code=status.HTTP_201_CREATED)
async def create_script(
    payload: ScriptCreate, current_user: CurrentUser, db: DbSession
) -> Script:
    if payload.project_id:
        result = await db.execute(
            select(Project).where(
                Project.id == payload.project_id, Project.user_id == current_user.id
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="项目不存在")

    script = Script(
        project_id=payload.project_id,
        user_id=current_user.id,
        title=payload.title,
        content=payload.content,
        description=payload.description,
        source_type="user",
    )
    db.add(script)
    await db.flush()
    await db.refresh(script)
    return script


@router.put("/{script_id}", response_model=ScriptResponse)
async def update_script(
    script_id: UUID, payload: ScriptUpdate, current_user: CurrentUser, db: DbSession
) -> Script:
    result = await db.execute(
        select(Script).where(Script.id == script_id, Script.user_id == current_user.id)
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="剧本不存在")

    if payload.title is not None:
        script.title = payload.title
    if payload.content is not None:
        script.content = payload.content
    if payload.description is not None:
        script.description = payload.description

    await db.flush()
    await db.refresh(script)
    return script


@router.delete("/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_script(
    script_id: UUID, current_user: CurrentUser, db: DbSession
) -> None:
    result = await db.execute(
        select(Script).where(Script.id == script_id, Script.user_id == current_user.id)
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="剧本不存在")
    await db.delete(script)


@router.post("/{script_id}/save-template", response_model=ScriptResponse)
async def save_as_template(
    script_id: UUID, current_user: CurrentUser, db: DbSession
) -> Script:
    result = await db.execute(
        select(Script).where(Script.id == script_id, Script.user_id == current_user.id)
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="剧本不存在")

    script.is_template = True
    await db.flush()
    await db.refresh(script)
    return script


@router.post("/{script_id}/publish", response_model=ScriptResponse)
async def publish_to_community(
    script_id: UUID, current_user: CurrentUser, db: DbSession
) -> Script:
    result = await db.execute(
        select(Script).where(Script.id == script_id, Script.user_id == current_user.id)
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="剧本不存在")

    script.is_template = True
    script.is_public = True
    await db.flush()
    await db.refresh(script)
    return script


@router.post("/{template_id}/clone", response_model=ScriptResponse)
async def clone_template(
    template_id: UUID,
    payload: CloneTemplateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> Script:
    result = await db.execute(select(Script).where(Script.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    if not template.is_template and template.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权使用此模板")

    proj_result = await db.execute(
        select(Project).where(
            Project.id == payload.project_id, Project.user_id == current_user.id
        )
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="项目不存在")

    cloned = Script(
        id=uuid_mod.uuid4(),
        project_id=payload.project_id,
        user_id=current_user.id,
        title=f"{template.title} (副本)",
        content=template.content,
        description=template.description,
        source_type="user",
    )
    db.add(cloned)
    # Increment clone count on the original template
    template.clone_count = (template.clone_count or 0) + 1
    await db.flush()
    await db.refresh(cloned)
    return cloned


@router.post("/generate", response_model=ScriptResponse, status_code=status.HTTP_201_CREATED)
async def generate_script(
    payload: GenerateScriptRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> Script:
    proj_result = await db.execute(
        select(Project).where(
            Project.id == payload.project_id, Project.user_id == current_user.id
        )
    )
    if not proj_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="项目不存在")

    config_result = await db.execute(
        select(UserAiConfig).where(
            UserAiConfig.id == payload.ai_config_id,
            UserAiConfig.user_id == current_user.id,
        )
    )
    ai_config = config_result.scalar_one_or_none()
    if not ai_config:
        raise HTTPException(status_code=404, detail="AI配置不存在")

    photo_ids_str: list[str] = []
    photo_count = 0
    if payload.photo_ids:
        photo_ids_str = [str(pid) for pid in payload.photo_ids]
        photo_count = len(photo_ids_str)
    else:
        photos_result = await db.execute(
            select(Photo).where(Photo.project_id == payload.project_id)
        )
        project_photos = list(photos_result.scalars().all())
        photo_ids_str = [str(p.id) for p in project_photos]
        photo_count = len(project_photos)

    try:
        content = await generate_script_with_llm(
            description=payload.description,
            photo_ids=photo_ids_str,
            photo_count=photo_count,
            provider=ai_config.provider,
            base_url=ai_config.base_url,
            api_key=decrypt_api_key(ai_config.api_key_encrypted),
            model=ai_config.model,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI服务调用失败: {str(e)}")

    script = Script(
        project_id=payload.project_id,
        user_id=current_user.id,
        title=f"AI生成 - {payload.description[:30]}",
        content=content,
        description=payload.description,
        source_type="ai_generated",
    )
    db.add(script)
    await db.flush()
    await db.refresh(script)
    return script
