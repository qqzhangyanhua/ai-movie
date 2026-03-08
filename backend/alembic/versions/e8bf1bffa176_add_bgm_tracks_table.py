"""Add bgm_tracks table

Revision ID: e8bf1bffa176
Revises: 001_storage_migration
Create Date: 2026-03-08 12:35:05.782910

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8bf1bffa176'
down_revision: Union[str, None] = '001_storage_migration'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'bgm_tracks',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('duration', sa.Float(), nullable=False, default=0.0),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bgm_tracks_category'), 'bgm_tracks', ['category'], unique=False)
    op.create_index(op.f('ix_bgm_tracks_user_id'), 'bgm_tracks', ['user_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_bgm_tracks_user_id'), table_name='bgm_tracks')
    op.drop_index(op.f('ix_bgm_tracks_category'), table_name='bgm_tracks')
    op.drop_table('bgm_tracks')
