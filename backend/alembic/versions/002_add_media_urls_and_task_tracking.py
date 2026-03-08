"""add_media_urls_and_task_tracking

Revision ID: 002_add_media_urls_and_task_tracking
Revises: e8bf1bffa176
Create Date: 2026-03-08 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_add_media_urls_and_task_tracking'
down_revision = 'e8bf1bffa176'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add URL fields to photos table
    op.add_column('photos', sa.Column('file_url', sa.String(length=500), nullable=True))
    op.add_column('photos', sa.Column('thumb_url', sa.String(length=500), nullable=True))

    # Add URL field to bgm_tracks table
    op.add_column('bgm_tracks', sa.Column('file_url', sa.String(length=500), nullable=True))

    # Add URL and tracking fields to video_tasks table
    op.add_column('video_tasks', sa.Column('result_video_url', sa.String(length=500), nullable=True))
    op.add_column('video_tasks', sa.Column('celery_task_id', sa.String(length=255), nullable=True))
    op.add_column('video_tasks', sa.Column('retry_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('video_tasks', sa.Column('started_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove fields from video_tasks table
    op.drop_column('video_tasks', 'started_at')
    op.drop_column('video_tasks', 'retry_count')
    op.drop_column('video_tasks', 'celery_task_id')
    op.drop_column('video_tasks', 'result_video_url')

    # Remove field from bgm_tracks table
    op.drop_column('bgm_tracks', 'file_url')

    # Remove fields from photos table
    op.drop_column('photos', 'thumb_url')
    op.drop_column('photos', 'file_url')
