"""
数据迁移脚本：回填 storage_key 字段

使用方法：
    python -m scripts.backfill_storage_keys
"""
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.photo import Photo


async def backfill_storage_keys():
    """回填现有照片的 storage_key 字段"""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(
            select(Photo).where(Photo.storage_key.is_(None))
        )
        photos = result.scalars().all()

        print(f"找到 {len(photos)} 张照片需要回填 storage_key")

        for photo in photos:
            photo.storage_key = photo.file_path
            photo.storage_type = "local"

        await session.commit()
        print(f"成功回填 {len(photos)} 张照片")


if __name__ == "__main__":
    asyncio.run(backfill_storage_keys())
