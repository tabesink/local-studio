from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, text
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
DOMAIN_STATE_STOPPED = "stopped"
DOMAIN_STATE_RUNNING = "running"
DOMAIN_STATE_DELETING = "deleting"
DOMAIN_STATES = (DOMAIN_STATE_STOPPED, DOMAIN_STATE_RUNNING, DOMAIN_STATE_DELETING)
DOMAIN_OPERATION_CREATE = "create"
DOMAIN_OPERATION_START = "start"
DOMAIN_OPERATION_STOP = "stop"
DOMAIN_OPERATION_DELETE = "delete"
DOMAIN_OPERATION_TYPES = (
    DOMAIN_OPERATION_CREATE,
    DOMAIN_OPERATION_START,
    DOMAIN_OPERATION_STOP,
    DOMAIN_OPERATION_DELETE,
)
DOMAIN_OPERATION_STATUS_QUEUED = "queued"
DOMAIN_OPERATION_STATUS_RUNNING = "running"
DOMAIN_OPERATION_STATUS_SUCCEEDED = "succeeded"
DOMAIN_OPERATION_STATUS_FAILED = "failed"
DOMAIN_OPERATION_STATUS_CANCELLED = "cancelled"
DOMAIN_OPERATION_STATUSES = (
    DOMAIN_OPERATION_STATUS_QUEUED,
    DOMAIN_OPERATION_STATUS_RUNNING,
    DOMAIN_OPERATION_STATUS_SUCCEEDED,
    DOMAIN_OPERATION_STATUS_FAILED,
    DOMAIN_OPERATION_STATUS_CANCELLED,
)
DOMAIN_OPERATION_ACTIVE_STATUSES = (DOMAIN_OPERATION_STATUS_QUEUED, DOMAIN_OPERATION_STATUS_RUNNING)
SOURCE_STATE_PENDING = "pending"
SOURCE_STATE_PREPARED = "prepared"
SOURCE_STATE_DELETING = "deleting"
SOURCE_STATES = (SOURCE_STATE_PENDING, SOURCE_STATE_PREPARED, SOURCE_STATE_DELETING)
SOURCE_PREP_OPERATION_PREPARE = "prepare"
SOURCE_PREP_OPERATION_TYPES = (SOURCE_PREP_OPERATION_PREPARE,)
SOURCE_PREP_STATUS_QUEUED = "queued"
SOURCE_PREP_STATUS_RUNNING = "running"
SOURCE_PREP_STATUS_SUCCEEDED = "succeeded"
SOURCE_PREP_STATUS_FAILED = "failed"
SOURCE_PREP_STATUS_CANCELLED = "cancelled"
SOURCE_PREP_STATUSES = (
    SOURCE_PREP_STATUS_QUEUED,
    SOURCE_PREP_STATUS_RUNNING,
    SOURCE_PREP_STATUS_SUCCEEDED,
    SOURCE_PREP_STATUS_FAILED,
    SOURCE_PREP_STATUS_CANCELLED,
)
SOURCE_PREP_ACTIVE_STATUSES = (SOURCE_PREP_STATUS_QUEUED, SOURCE_PREP_STATUS_RUNNING)
SOURCE_BLOCK_KIND_TEXT = "text"
SOURCE_BLOCK_KIND_TABLE = "table"
SOURCE_BLOCK_KIND_FIGURE = "figure"
SOURCE_BLOCK_KINDS = (SOURCE_BLOCK_KIND_TEXT, SOURCE_BLOCK_KIND_TABLE, SOURCE_BLOCK_KIND_FIGURE)
SOURCE_INDEX_STATE_NOT_REQUESTED = "not_requested"
SOURCE_INDEX_STATE_QUEUED = "queued"
SOURCE_INDEX_STATE_SUBMITTING = "submitting"
SOURCE_INDEX_STATE_ACCEPTED = "accepted"
SOURCE_INDEX_STATE_READY = "ready"
SOURCE_INDEX_STATE_FAILED = "failed"
SOURCE_INDEX_STATE_CANCELLING = "cancelling"
SOURCE_INDEX_STATE_CANCELLED = "cancelled"
SOURCE_INDEX_STATES = (
    SOURCE_INDEX_STATE_NOT_REQUESTED,
    SOURCE_INDEX_STATE_QUEUED,
    SOURCE_INDEX_STATE_SUBMITTING,
    SOURCE_INDEX_STATE_ACCEPTED,
    SOURCE_INDEX_STATE_READY,
    SOURCE_INDEX_STATE_FAILED,
    SOURCE_INDEX_STATE_CANCELLING,
    SOURCE_INDEX_STATE_CANCELLED,
)
SOURCE_INDEX_ACTIVE_STATES = (
    SOURCE_INDEX_STATE_QUEUED,
    SOURCE_INDEX_STATE_SUBMITTING,
    SOURCE_INDEX_STATE_ACCEPTED,
    SOURCE_INDEX_STATE_CANCELLING,
)
SOURCE_INDEX_REMOTE_STATES = (
    SOURCE_INDEX_STATE_ACCEPTED,
    SOURCE_INDEX_STATE_READY,
)


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


class Domain(Base):
    __tablename__ = "domains"
    __table_args__ = (
        CheckConstraint("state in ('stopped', 'running', 'deleting')", name="ck_domains_state"),
        CheckConstraint("control_generation >= 1", name="ck_domains_control_generation_positive"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(16), nullable=False, default=DOMAIN_STATE_STOPPED)
    embedding_profile_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("model_profiles.id"),
        index=True,
        nullable=False,
    )
    runtime_instance_id: Mapped[str] = mapped_column(String(36), nullable=False, default=lambda: str(uuid.uuid4()))
    control_generation: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now, onupdate=utc_now)

    embedding_profile: Mapped[ModelProfile] = relationship()
    operations: Mapped[list["DomainOperation"]] = relationship(
        back_populates="domain",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    sources: Mapped[list["SourceDocument"]] = relationship(
        back_populates="domain",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class DomainOperation(Base):
    __tablename__ = "domain_operations"
    __table_args__ = (
        CheckConstraint("operation_type in ('create', 'start', 'stop', 'delete')", name="ck_domain_operations_type"),
        CheckConstraint(
            "status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')",
            name="ck_domain_operations_status",
        ),
        Index("ix_domain_operations_domain_created", "domain_id", text("created_at DESC")),
        Index(
            "uq_domain_operations_one_active",
            "domain_id",
            unique=True,
            sqlite_where=text("status IN ('queued', 'running')"),
            postgresql_where=text("status IN ('queued', 'running')"),
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("domains.id", ondelete="CASCADE"),
        nullable=False,
    )
    operation_type: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    control_generation_at_start: Mapped[int] = mapped_column(Integer, nullable=False)
    requested_by_user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    lease_owner: Mapped[str | None] = mapped_column(String(64), nullable=True)
    lease_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now, onupdate=utc_now)

    domain: Mapped[Domain] = relationship(back_populates="operations")


class SourceDocument(Base):
    __tablename__ = "source_documents"
    __table_args__ = (
        CheckConstraint("state in ('pending', 'prepared', 'deleting')", name="ck_source_documents_state"),
        CheckConstraint("parser_kind in ('docling', 'reducto')", name="ck_source_documents_parser_kind"),
        CheckConstraint(
            "index_state in ('not_requested', 'queued', 'submitting', 'accepted', 'ready', 'failed', 'cancelling', 'cancelled')",
            name="ck_source_documents_index_state",
        ),
        CheckConstraint("original_size_bytes > 0", name="ck_source_documents_size_positive"),
        CheckConstraint("preparation_generation >= 1", name="ck_source_documents_generation_positive"),
        CheckConstraint("index_generation >= 0", name="ck_source_documents_index_generation_nonnegative"),
        Index("uq_source_documents_domain_hash", "domain_id", "original_sha256", unique=True),
        Index("ix_source_documents_domain_created", "domain_id", text("created_at DESC")),
        Index("ix_source_documents_domain_index_state", "domain_id", "index_state"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    domain_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("domains.id", ondelete="CASCADE"),
        nullable=False,
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(160), nullable=False)
    original_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    original_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    state: Mapped[str] = mapped_column(String(16), nullable=False, default=SOURCE_STATE_PENDING)
    parser_kind: Mapped[str] = mapped_column(String(32), nullable=False)
    preparation_generation: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    index_state: Mapped[str] = mapped_column(String(16), nullable=False, default=SOURCE_INDEX_STATE_NOT_REQUESTED)
    index_generation: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    index_request_id: Mapped[str | None] = mapped_column(String(96), nullable=True)
    index_content_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    index_remote_document_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    index_error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    index_error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    index_lease_owner: Mapped[str | None] = mapped_column(String(64), nullable=True)
    index_lease_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    index_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    index_ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    index_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_by_user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now, onupdate=utc_now)

    domain: Mapped[Domain] = relationship(back_populates="sources")
    operations: Mapped[list["SourcePreparationOperation"]] = relationship(
        back_populates="source_document",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    blocks: Mapped[list["SourceBlock"]] = relationship(
        back_populates="source_document",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    images: Mapped[list["SourceImage"]] = relationship(
        back_populates="source_document",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class SourcePreparationOperation(Base):
    __tablename__ = "source_preparation_operations"
    __table_args__ = (
        CheckConstraint("operation_type in ('prepare')", name="ck_source_preparation_operations_type"),
        CheckConstraint(
            "status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')",
            name="ck_source_preparation_operations_status",
        ),
        CheckConstraint("preparation_generation_at_start >= 1", name="ck_source_preparation_operations_generation_positive"),
        Index("ix_source_preparation_operations_domain_created", "domain_id", text("created_at DESC")),
        Index("ix_source_preparation_operations_source_created", "source_document_id", text("created_at DESC")),
        Index(
            "uq_source_preparation_operations_one_active",
            "source_document_id",
            unique=True,
            sqlite_where=text("status IN ('queued', 'running')"),
            postgresql_where=text("status IN ('queued', 'running')"),
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("source_documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    domain_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("domains.id", ondelete="CASCADE"),
        nullable=False,
    )
    operation_type: Mapped[str] = mapped_column(String(16), nullable=False, default=SOURCE_PREP_OPERATION_PREPARE)
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    preparation_generation_at_start: Mapped[int] = mapped_column(Integer, nullable=False)
    requested_by_user_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    lease_owner: Mapped[str | None] = mapped_column(String(64), nullable=True)
    lease_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now, onupdate=utc_now)

    source_document: Mapped[SourceDocument] = relationship(back_populates="operations")


class SourceBlock(Base):
    __tablename__ = "source_blocks"
    __table_args__ = (
        CheckConstraint("source_order >= 1", name="ck_source_blocks_order_positive"),
        CheckConstraint("kind in ('text', 'table', 'figure')", name="ck_source_blocks_kind"),
        CheckConstraint("heading_level is null or heading_level >= 1", name="ck_source_blocks_heading_positive"),
        CheckConstraint("page_start is null or page_start >= 1", name="ck_source_blocks_page_start_positive"),
        CheckConstraint("page_end is null or page_end >= 1", name="ck_source_blocks_page_end_positive"),
        CheckConstraint("page_start is null or page_end is null or page_end >= page_start", name="ck_source_blocks_page_range"),
        Index("uq_source_blocks_source_order", "source_document_id", "source_order", unique=True),
        Index("ix_source_blocks_domain_source", "domain_id", "source_document_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("source_documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    domain_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("domains.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_order: Mapped[int] = mapped_column(Integer, nullable=False)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)
    canonical_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    heading_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    page_start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    page_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)

    source_document: Mapped[SourceDocument] = relationship(back_populates="blocks")
    images: Mapped[list["SourceImage"]] = relationship(
        back_populates="source_block",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class SourceImage(Base):
    __tablename__ = "source_images"
    __table_args__ = (
        CheckConstraint("page_number is null or page_number >= 1", name="ck_source_images_page_positive"),
        Index("ix_source_images_source_block", "source_document_id", "source_block_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("source_documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    source_block_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("source_blocks.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(80), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, default=utc_now)

    source_document: Mapped[SourceDocument] = relationship(back_populates="images")
    source_block: Mapped[SourceBlock] = relationship(back_populates="images")
