"""Add storage fields to photos and ai_config_id to video_tasks

Revision ID: 001_storage_migration
Revises:
Create Date: 2026-03-07

"""
from alembic import op
import sqlalchemy as sa


revision = '001_storage_migration'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add storage fields to photos table
    op.add_column('photos', sa.Column('storage_key', sa.String(500), nullable=True))
    op.add_column('photos', sa.Column('storage_type', sa.String(20), server_default='local', nullable=False))

    # Add ai_config_id to video_tasks table
    op.add_column('video_tasks', sa.Column('ai_config_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_video_tasks_ai_config_id', 'video_tasks', 'user_ai_configs', ['ai_config_id'], ['id'])


def downgrade():
    # Remove ai_config_id from video_tasks
    op.drop_constraint('fk_video_tasks_ai_config_id', 'video_tasks', type_='foreignkey')
    op.drop_column('video_tasks', 'ai_config_id')

    # Remove storage fields from photos
    op.drop_column('photos', 'storage_type')
    op.drop_column('photos', 'storage_key')
