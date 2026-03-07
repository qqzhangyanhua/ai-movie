from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.core.security import encrypt_api_key
from app.models.user_ai_config import UserAiConfig
from app.schemas.ai_config import AiConfigCreate, AiConfigUpdate, AiConfigResponse

router = APIRouter()


@router.get("", response_model=list[AiConfigResponse])
async def list_ai_configs(current_user: CurrentUser, db: DbSession) -> list[UserAiConfig]:
    result = await db.execute(
        select(UserAiConfig)
        .where(UserAiConfig.user_id == current_user.id)
        .order_by(UserAiConfig.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=AiConfigResponse, status_code=status.HTTP_201_CREATED)
async def create_ai_config(
    payload: AiConfigCreate, current_user: CurrentUser, db: DbSession
) -> UserAiConfig:
    if payload.is_default:
        await _clear_default(current_user.id, db)

    config = UserAiConfig(
        user_id=current_user.id,
        name=payload.name,
        provider=payload.provider,
        base_url=payload.base_url,
        api_key_encrypted=encrypt_api_key(payload.api_key),
        model=payload.model,
        is_default=payload.is_default,
    )
    db.add(config)
    await db.flush()
    await db.refresh(config)
    return config


@router.put("/{config_id}", response_model=AiConfigResponse)
async def update_ai_config(
    config_id: UUID,
    payload: AiConfigUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> UserAiConfig:
    result = await db.execute(
        select(UserAiConfig).where(
            UserAiConfig.id == config_id, UserAiConfig.user_id == current_user.id
        )
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")

    if payload.name is not None:
        config.name = payload.name
    if payload.provider is not None:
        config.provider = payload.provider
    if payload.base_url is not None:
        config.base_url = payload.base_url
    if payload.api_key is not None:
        config.api_key_encrypted = encrypt_api_key(payload.api_key)
    if payload.model is not None:
        config.model = payload.model
    if payload.is_default is True:
        await _clear_default(current_user.id, db)
        config.is_default = True
    elif payload.is_default is False:
        config.is_default = False

    await db.flush()
    await db.refresh(config)
    return config


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ai_config(
    config_id: UUID, current_user: CurrentUser, db: DbSession
) -> None:
    result = await db.execute(
        select(UserAiConfig).where(
            UserAiConfig.id == config_id, UserAiConfig.user_id == current_user.id
        )
    )
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="配置不存在")
    await db.delete(config)


async def _clear_default(user_id: UUID, db: DbSession) -> None:
    result = await db.execute(
        select(UserAiConfig).where(
            UserAiConfig.user_id == user_id, UserAiConfig.is_default.is_(True)
        )
    )
    for cfg in result.scalars().all():
        cfg.is_default = False
