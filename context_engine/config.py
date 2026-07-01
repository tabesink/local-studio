from __future__ import annotations

import os
from dataclasses import dataclass, field


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return value


def _env_int(name: str, default: int) -> int:
    value = _env(name)
    if value is None:
        return default
    return int(value)


def _env_bool(name: str, default: bool) -> bool:
    value = _env(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    database_url: str = field(
        default_factory=lambda: _env(
            "CONTEXT_ENGINE_DATABASE_URL",
            "postgresql+psycopg://context_engine@localhost/context_engine",
        )
        or "postgresql+psycopg://context_engine@localhost/context_engine"
    )
    admin_username: str | None = field(default_factory=lambda: _env("CE_ADMIN_USERNAME"))
    admin_password: str | None = field(default_factory=lambda: _env("CE_ADMIN_PASSWORD"), repr=False)
    config_encryption_key: str | None = field(default_factory=lambda: _env("CONFIG_ENCRYPTION_KEY"), repr=False)
    testing: bool = field(default_factory=lambda: _env_bool("CONTEXT_ENGINE_TESTING", False))
    api_prefix: str = "/api/v1"
    session_cookie_name: str = "ce_session"
    session_cookie_secure: bool = field(default_factory=lambda: _env_bool("CE_SESSION_COOKIE_SECURE", True))
    session_cookie_samesite: str = field(default_factory=lambda: _env("CE_SESSION_COOKIE_SAMESITE", "lax") or "lax")
    session_ttl_seconds: int = field(default_factory=lambda: _env_int("CE_SESSION_TTL_SECONDS", 60 * 60 * 8))
    request_id_header: str = "X-Request-ID"
    domain_runtime_root: str = field(default_factory=lambda: _env("CE_DOMAIN_RUNTIME_ROOT", ".data/domain-runtimes") or ".data/domain-runtimes")
    domain_delete_worker_id: str = field(default_factory=lambda: _env("CE_DOMAIN_DELETE_WORKER_ID", "domain-delete-worker") or "domain-delete-worker")
    domain_delete_lease_seconds: int = field(default_factory=lambda: _env_int("CE_DOMAIN_DELETE_LEASE_SECONDS", 60))

    @classmethod
    def from_env(cls) -> "Settings":
        return cls()
