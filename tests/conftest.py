from __future__ import annotations

from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from context_engine.config import Settings


@pytest.fixture
def sqlite_url(tmp_path: Path) -> str:
    return f"sqlite:///{tmp_path / 'context_engine_test.sqlite3'}"


@pytest.fixture
def settings(sqlite_url: str, tmp_path: Path) -> Settings:
    return Settings(
        database_url=sqlite_url,
        admin_username="admin@example.test",
        admin_password="correct horse battery staple",
        session_cookie_secure=False,
        session_ttl_seconds=3600,
        domain_runtime_root=str(tmp_path / "domain-runtimes"),
        source_storage_root=str(tmp_path / "source-storage"),
        testing=True,
    )


def run_migrations(database_url: str) -> None:
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(cfg, "head")


@pytest.fixture
def migrated_db(sqlite_url: str) -> str:
    run_migrations(sqlite_url)
    return sqlite_url


@pytest.fixture
def app(settings: Settings, migrated_db: str):
    from context_engine.app import create_app

    return create_app(settings)


@pytest.fixture
def db_session(migrated_db: str):
    engine = create_engine(migrated_db, connect_args={"check_same_thread": False}, future=True)
    factory = sessionmaker(bind=engine, expire_on_commit=False, future=True)
    session: Session = factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()
