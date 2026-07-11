from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


def _load(module_name: str, relative: str):
    path = ROOT / relative
    spec = importlib.util.spec_from_file_location(module_name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


smoke = _load("stack_smoke", "scripts/stack_smoke.py")
live = _load("stack_smoke_live_helpers", "scripts/stack_smoke_live.py")


def test_default_stack_smoke_does_not_reference_live_overlay() -> None:
    text = (ROOT / "scripts" / "stack_smoke.py").read_text(encoding="utf-8")
    assert "compose.stack.live.yml" not in text
    assert "CE_STACK_LIVE_RUNTIME_ROOT" not in text
    assert smoke.DEFAULT_COMPOSE_FILE.name == "compose.stack.yml"


def test_compose_base_accepts_extra_live_file() -> None:
    command = smoke.compose_base(
        ROOT / "compose.stack.yml",
        ROOT / ".env.stack.example",
        "proj",
        extra_compose_files=[ROOT / "compose.stack.live.yml"],
    )
    assert command.count("-f") == 2
    assert str(ROOT / "compose.stack.live.yml") in command


def test_require_live_prerequisites_requires_absolute_runtime_root() -> None:
    env = {
        "POSTGRES_DB": "db",
        "POSTGRES_USER": "user",
        "POSTGRES_PASSWORD": "pass",
        "CE_ADMIN_USERNAME": "admin@example.test",
        "CE_ADMIN_PASSWORD": "correct horse battery staple",
        "CONFIG_ENCRYPTION_KEY": "x" * 44,
        "CE_SESSION_COOKIE_SECURE": "false",
        "CE_STACK_LIVE_RUNTIME_ROOT": "relative/path",
    }
    with pytest.raises(Exception) as raised:
        live.require_live_prerequisites(env)
    assert getattr(raised.value, "message", None) == "CE_STACK_LIVE_RUNTIME_ROOT_must_be_absolute"


def test_env_map_from_compose_config_reads_live_kinds() -> None:
    text = """
services:
  api:
    environment:
      CE_DOMAIN_RUNTIME_CONTROLLER_KIND: docker
      CE_LIGHTRAG_CLIENT_KIND: native
      CE_DOMAIN_RUNTIME_ROOT: /tmp/ce-stack-domain-runtimes
"""
    values = live._env_map_from_compose_config(text)
    assert values["CE_DOMAIN_RUNTIME_CONTROLLER_KIND"] == "docker"
    assert values["CE_LIGHTRAG_CLIENT_KIND"] == "native"
