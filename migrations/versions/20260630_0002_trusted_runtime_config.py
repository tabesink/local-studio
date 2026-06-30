"""trusted runtime config

Revision ID: 20260630_0002
Revises: 20260630_0001
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa

revision = "20260630_0002"
down_revision = "20260630_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "provider_configs",
        sa.Column("provider_kind", sa.String(length=32), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("requires_credentials", sa.Boolean(), nullable=False),
        sa.Column("credential_ciphertext", sa.Text(), nullable=True),
        sa.Column("credential_updated_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("provider_kind in ('openai', 'bedrock', 'ollama', 'reducto')", name="ck_provider_configs_provider_kind"),
        sa.PrimaryKeyConstraint("provider_kind"),
    )

    op.create_table(
        "model_profiles",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("profile_kind", sa.String(length=32), nullable=False),
        sa.Column("provider_kind", sa.String(length=32), nullable=False),
        sa.Column("model_name", sa.String(length=200), nullable=False),
        sa.Column("vector_dimensions", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("profile_kind in ('synthesis', 'embedding')", name="ck_model_profiles_profile_kind"),
        sa.CheckConstraint("provider_kind in ('openai', 'bedrock', 'ollama')", name="ck_model_profiles_provider_kind"),
        sa.CheckConstraint("profile_kind != 'embedding' or vector_dimensions is not null", name="ck_model_profiles_embedding_dimensions_required"),
        sa.CheckConstraint("profile_kind != 'synthesis' or vector_dimensions is null", name="ck_model_profiles_synthesis_dimensions_absent"),
        sa.CheckConstraint("vector_dimensions is null or vector_dimensions > 0", name="ck_model_profiles_vector_dimensions_positive"),
        sa.ForeignKeyConstraint(["provider_kind"], ["provider_configs.provider_kind"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_model_profiles_provider_kind", "model_profiles", ["provider_kind"], unique=False)

    op.create_table(
        "runtime_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("active_synthesis_profile_id", sa.String(length=36), nullable=True),
        sa.Column("active_parser_kind", sa.String(length=32), server_default="docling", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("id = 1", name="ck_runtime_settings_singleton"),
        sa.CheckConstraint("active_parser_kind in ('docling', 'reducto')", name="ck_runtime_settings_active_parser_kind"),
        sa.ForeignKeyConstraint(["active_synthesis_profile_id"], ["model_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("runtime_settings")
    op.drop_index("ix_model_profiles_provider_kind", table_name="model_profiles")
    op.drop_table("model_profiles")
    op.drop_table("provider_configs")
