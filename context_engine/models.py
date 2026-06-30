from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from context_engine.db import Base, utc_now

ROLE_ADMINISTRATOR = "administrator"
ROLE_MEMBER = "member"

PROVIDER_OPENAI = "openai"
PROVIDER_BEDROCK = "bedrock"
PROVIDER_OLLAMA = "ollama"
PROVIDER_REDUCTO = "reducto"
PROVIDER_KINDS = (PROVIDER_OPENAI, PROVIDER_BEDROCK, PROVIDER_OLLAMA, PROVIDER_REDUCTO)
MODEL_PROVIDER_KINDS = (PROVIDER_OPENAI, PROVIDER_BEDROCK, PROVIDER_OLLAMA)
PROFILE_SYNTHESIS = "synthesis"
PROFILE_EMBEDDING = "embedding"
PROFILE_KINDS = (PROFILE_SYNTHESIS, PROFILE_EMBEDDING)
PARSER_DOCLING = "docling"
PARSER_REDUCTO = "reducto"
PARSER_KINDS = (PARSER_DOCLING, PARSER_REDUCTO)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default=ROLE_MEMBER)
    is_disabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now, onupdate=utc_now)
    password_changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)

    sessions: Mapped[list["AuthSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), index=True, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)

    user: Mapped[User] = relationship(back_populates="sessions")


class ProviderConfig(Base):
    __tablename__ = "provider_configs"
    __table_args__ = (
        CheckConstraint("provider_kind in ('openai', 'bedrock', 'ollama', 'reducto')", name="ck_provider_configs_provider_kind"),
    )

    provider_kind: Mapped[str] = mapped_column(String(32), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    requires_credentials: Mapped[bool] = mapped_column(Boolean, nullable=False)
    credential_ciphertext: Mapped[str | None] = mapped_column(Text, nullable=True)
    credential_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now, onupdate=utc_now)


class ModelProfile(Base):
    __tablename__ = "model_profiles"
    __table_args__ = (
        CheckConstraint("profile_kind in ('synthesis', 'embedding')", name="ck_model_profiles_profile_kind"),
        CheckConstraint("provider_kind in ('openai', 'bedrock', 'ollama')", name="ck_model_profiles_provider_kind"),
        CheckConstraint("profile_kind != 'embedding' or vector_dimensions is not null", name="ck_model_profiles_embedding_dimensions_required"),
        CheckConstraint("profile_kind != 'synthesis' or vector_dimensions is null", name="ck_model_profiles_synthesis_dimensions_absent"),
        CheckConstraint("vector_dimensions is null or vector_dimensions > 0", name="ck_model_profiles_vector_dimensions_positive"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    profile_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_kind: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("provider_configs.provider_kind"),
        index=True,
        nullable=False,
    )
    model_name: Mapped[str] = mapped_column(String(200), nullable=False)
    vector_dimensions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now, onupdate=utc_now)


class RuntimeSettings(Base):
    __tablename__ = "runtime_settings"
    __table_args__ = (
        CheckConstraint("id = 1", name="ck_runtime_settings_singleton"),
        CheckConstraint("active_parser_kind in ('docling', 'reducto')", name="ck_runtime_settings_active_parser_kind"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    active_synthesis_profile_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("model_profiles.id"),
        nullable=True,
    )
    active_parser_kind: Mapped[str] = mapped_column(String(32), nullable=False, default=PARSER_DOCLING)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now, onupdate=utc_now)
