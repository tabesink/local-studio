from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from context_engine.app import create_app
from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory
from context_engine.models import Domain, SOURCE_INDEX_STATE_READY, SourceDocument
from context_engine.services.domains import DockerDomainRuntimeController, DomainDeleteWorker
from context_engine.services.sources import SourcePreparationWorker
from context_engine.services.indexing import SourceIndexWorker
from tests.conftest import run_migrations


def _docker_available() -> bool:
    docker = shutil.which("docker")
    if docker is None:
        return False
    result = subprocess.run([docker, "info"], text=True, capture_output=True, check=False)
    return result.returncode == 0


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _configure_openai(client: TestClient) -> None:
    response = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "slice-a-docker-credential"})
    assert response.status_code == 200


@pytest.mark.skipif(not _docker_available(), reason="Docker daemon is required for the Slice A live runtime gate.")
def test_slice_a_live_docker_controller_native_index_and_evidence(tmp_path: Path) -> None:
    pytest.importorskip("json_repair")
    pytest.importorskip("nano_vectordb")
    pytest.importorskip("numpy")
    pytest.importorskip("tiktoken")
    sqlite_url = f"sqlite:///{tmp_path / 'context_engine.sqlite3'}"
    run_migrations(sqlite_url)
    settings = Settings(
        database_url=sqlite_url,
        admin_username="admin@example.test",
        admin_password="correct horse battery staple",
        session_cookie_secure=False,
        domain_runtime_root=str(tmp_path / "domain-runtimes"),
        domain_runtime_controller_kind="docker",
        domain_controller_command=f"{sys.executable} -m context_engine.tools.domain_runtime_controller",
        lightrag_client_kind="native",
        source_storage_root=str(tmp_path / "source-storage"),
        testing=True,
    )
    app = create_app(settings)
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    domain_id = "slice-a"

    try:
        with TestClient(app) as client:
            _login_admin(client, settings)
            _configure_openai(client)
            created = client.post("/api/v1/admin/domains", json={"id": domain_id, "embeddingProfileId": "openai-embedding-default"})
            assert created.status_code == 201
            started = client.post(f"/api/v1/admin/domains/{domain_id}/start")
            assert started.status_code == 200
            assert started.json()["domain"]["available"] is True
            member_domains = client.get("/api/v1/domains")
            assert member_domains.json()["domains"] == [{"id": domain_id, "displayName": domain_id, "available": True}]
            uploaded = client.post(
                f"/api/v1/admin/domains/{domain_id}/sources",
                files={"file": ("manual.md", b"# Manual\nThe startup sequence requires lockout and inspection.", "text/markdown")},
            )
            assert uploaded.status_code == 201
            source_id = uploaded.json()["source"]["id"]

        db = factory()
        try:
            assert SourcePreparationWorker(settings).run_once(db) is True
            assert SourceIndexWorker(settings).run_once(db) is True
            assert SourceIndexWorker(settings).run_once(db) is True
            source = db.get(SourceDocument, source_id)
            assert source is not None
            assert source.index_state == SOURCE_INDEX_STATE_READY
        finally:
            db.close()

        with TestClient(app) as client:
            _login_admin(client, settings)
            evidence = client.post(f"/api/v1/domains/{domain_id}/evidence", json={"question": "What sequence is required?"})
            assert evidence.status_code == 200
            payload = evidence.json()
            assert payload["result"] == "evidence_found"
            assert payload["evidence"]
            stopped = client.post(f"/api/v1/admin/domains/{domain_id}/stop")
            assert stopped.status_code == 200
            accepted_delete = client.delete(f"/api/v1/admin/domains/{domain_id}")
            assert accepted_delete.status_code == 202

        db = factory()
        try:
            assert DomainDeleteWorker(settings).run_once(db) is True
            assert db.get(Domain, domain_id) is None
        finally:
            db.close()
    finally:
        db = factory()
        try:
            domain = db.get(Domain, domain_id)
            if domain is not None:
                DockerDomainRuntimeController(settings).delete(domain)
        finally:
            db.close()
            engine.dispose()
