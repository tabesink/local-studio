from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load(module_name: str, relative: str):
    path = ROOT / relative
    spec = importlib.util.spec_from_file_location(module_name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


safety = _load("stack_safety_scan", "scripts/stack_safety_scan.py")
smoke = _load("stack_smoke", "scripts/stack_smoke.py")


def test_stack_smoke_defaults_point_at_stack_fixtures() -> None:
    assert smoke.DEFAULT_COMPOSE_FILE.name == "compose.stack.yml"
    assert smoke.DEFAULT_ENV_FILE.name == ".env.stack.local"
    assert smoke.DEFAULT_PROJECT_NAME == "context_engine_stack"


def test_safety_scan_allows_lease_worker_in_compose() -> None:
    compose = (ROOT / "compose.stack.yml").read_text(encoding="utf-8")
    failures: list[str] = []
    safety.scan_compose(Path("compose.stack.yml"), compose, failures)
    assert failures == []
    assert "\n  worker:" in compose
    assert 'command: ["python", "-m", "context_engine.worker"]' in compose


def test_safety_scan_allows_shell_string_lease_worker_command() -> None:
    text = """services:
  worker:
    command: python -m context_engine.worker
"""
    failures: list[str] = []
    safety.scan_compose(Path("tmp-compose.yml"), text, failures)
    assert failures == []


def test_safety_scan_rejects_wrong_worker_command() -> None:
    text = """services:
  worker:
    command: ["python", "-m", "context_engine.tools.other_worker"]
"""
    failures: list[str] = []
    safety.scan_compose(Path("tmp-compose.yml"), text, failures)
    assert "tmp-compose.yml:worker_command_invalid" in failures


def test_safety_scan_rejects_missing_worker_service() -> None:
    text = """services:
  api:
    command: ["python", "-m", "uvicorn", "context_engine.app:create_app"]
"""
    failures: list[str] = []
    safety.scan_compose(Path("tmp-compose.yml"), text, failures)
    assert "tmp-compose.yml:worker_service_missing" in failures


def test_safety_scan_rejects_redis_service() -> None:
    text = "services:\n  redis:\n    image: redis:7\n"
    failures: list[str] = []
    safety.scan_compose(Path("tmp-compose.yml"), text, failures)
    assert any("compose_forbidden" in item for item in failures)


def test_safety_scan_rejects_docker_sock_mount() -> None:
    text = """services:
  worker:
    command: ["python", "-m", "context_engine.worker"]
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
"""
    failures: list[str] = []
    safety.scan_compose(Path("tmp-compose.yml"), text, failures)
    assert any("compose_forbidden" in item and "docker\\.sock" in item for item in failures)
