import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship(back_populates="projects")  # type: ignore[name-defined]  # noqa: F821
    photos: Mapped[list["Photo"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    scripts: Mapped[list["Script"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
    video_tasks: Mapped[list["VideoTask"]] = relationship(back_populates="project", cascade="all, delete-orphan")  # type: ignore[name-defined]  # noqa: F821
