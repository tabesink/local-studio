from __future__ import annotations

import importlib.util
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env.stack.local"
COMPOSE_FILE = ROOT / "compose.stack.yml"
NEGATIVE_PROJECT = "context_engine_stack_neg"


def _load(module_name: str, relative: str):
    path = ROOT / relative
    spec = importlib.util.spec_from_file_location(module_name, path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


smoke = _load("stack_smoke_negative", "scripts/stack_smoke.py")


def _docker_available() -> bool:
    docker = shutil.which("docker")
    if docker is None:
        return False
    result = subprocess.run([docker, "info"], text=True, capture_output=True, check=False)
    return result.returncode == 0


def _stack_negative_ready() -> bool:
    return _docker_available() and ENV_FILE.exists() and COMPOSE_FILE.exists()


def _assert_safe_failure_note(note: str) -> None:
    lowered = note.lower()
    assert "lockout" not in lowered
    assert "inspection" not in lowered
    assert "startup" not in lowered
    assert "traceback" not in lowered
    assert note in {"service_not_healthy", "prepare_index_timeout", "service_exited", "service_not_running"}


def test_worker_liveness_failure_note_is_safe() -> None:
    evidence = smoke.Evidence()
    evidence.fail("worker", "service_not_healthy")
    public = evidence.to_public_dict()
    assert public["result"] == "failed"
    failed = public["checks"][-1]
    assert failed["check"] == "worker"
    assert failed["note"] == "service_not_healthy"
    _assert_safe_failure_note(failed["note"])
    blob = json.dumps(public)
    assert smoke.STACK_SMOKE_SOURCE_BYTES.decode("utf-8") not in blob
    assert smoke.STACK_SMOKE_QUESTION not in blob


def test_prepare_index_timeout_failure_note_is_safe() -> None:
    evidence = smoke.Evidence()
    evidence.fail("source_prepared_indexed", "prepare_index_timeout")
    public = evidence.to_public_dict()
    failed = public["checks"][-1]
    assert failed["check"] == "source_prepared_indexed"
    assert failed["note"] == "prepare_index_timeout"
    _assert_safe_failure_note(failed["note"])
    blob = json.dumps(public)
    assert "manual.md" not in blob
    assert smoke.STACK_SMOKE_SOURCE_BYTES.decode("utf-8") not in blob


@pytest.mark.integration_docker
@pytest.mark.skipif(not _stack_negative_ready(), reason="Docker + .env.stack.local required for stack worker negative proofs.")
def test_absent_worker_fails_at_liveness(tmp_path: Path) -> None:
    compose = smoke.compose_base(COMPOSE_FILE, ENV_FILE, NEGATIVE_PROJECT)
    evidence_path = tmp_path / "stack-smoke-neg-absent.json"
    try:
        smoke.require_command(compose + ["down", "--volumes", "--remove-orphans"], "compose_reset", timeout=120)
        smoke.require_command(compose + ["up", "--build", "-d", "--scale", "worker=0"], "compose_up", timeout=900)
        smoke.wait_for_service_health(compose, "postgres", timeout_seconds=120)
        smoke.wait_for_service_exit_success(compose, "migrate", timeout_seconds=120)
        smoke.wait_for_service_health(compose, "api", timeout_seconds=180)
        with pytest.raises(smoke.SmokeFailure) as raised:
            smoke.wait_for_service_health(compose, "worker", timeout_seconds=20)
        assert raised.value.check == "worker"
        assert raised.value.message == "service_not_healthy"
        _assert_safe_failure_note(raised.value.message)
        evidence = smoke.Evidence()
        evidence.fail(raised.value.check, raised.value.message)
        evidence_path.write_text(json.dumps(evidence.to_public_dict(), indent=2) + "\n", encoding="utf-8")
        assert "lockout" not in evidence_path.read_text(encoding="utf-8")
    finally:
        subprocess.run(compose + ["down", "--volumes", "--remove-orphans"], check=False, capture_output=True, text=True)


@pytest.mark.integration_docker
@pytest.mark.skipif(not _stack_negative_ready(), reason="Docker + .env.stack.local required for stack worker negative proofs.")
def test_mid_pilot_worker_stop_fails_prepare_index_timeout(tmp_path: Path) -> None:
    if os.environ.get("CE_RUN_STACK_NEGATIVE_MID_PILOT") != "1":
        pytest.skip("Set CE_RUN_STACK_NEGATIVE_MID_PILOT=1 to run the mid-pilot compose stop proof.")

    compose = smoke.compose_base(COMPOSE_FILE, ENV_FILE, f"{NEGATIVE_PROJECT}_mid")
    env = smoke.effective_env(ENV_FILE)
    api_url = f"http://127.0.0.1:{env.get('STACK_API_PORT', '8000')}"
    try:
        smoke.require_command(compose + ["down", "--volumes", "--remove-orphans"], "compose_reset", timeout=120)
        smoke.require_command(compose + ["up", "--build", "-d"], "compose_up", timeout=900)
        smoke.wait_for_service_health(compose, "postgres", timeout_seconds=120)
        smoke.wait_for_service_exit_success(compose, "migrate", timeout_seconds=120)
        smoke.wait_for_service_health(compose, "api", timeout_seconds=180)
        smoke.wait_for_service_health(compose, "frontend", timeout_seconds=180)
        smoke.wait_for_service_health(compose, "worker", timeout_seconds=60)

        import http.cookiejar

        jar = http.cookiejar.CookieJar()
        smoke.check_json_endpoint(
            smoke.Evidence(),
            "api_admin_login",
            "POST",
            f"{api_url}/api/v1/auth/login",
            jar=jar,
            body={"username": env["CE_ADMIN_USERNAME"], "password": env["CE_ADMIN_PASSWORD"]},
        )

        def stop_worker() -> None:
            smoke.require_command(compose + ["stop", "worker"], "compose_stop_worker", timeout=60)

        evidence = smoke.Evidence()
        with pytest.raises(smoke.SmokeFailure) as raised:
            smoke.run_pilot_path_http(
                evidence,
                api_url=api_url,
                jar=jar,
                compose=compose,
                pilot_timeout_seconds=30,
                poll_interval_seconds=1.0,
                after_source_upload=stop_worker,
            )
        assert raised.value.check == "source_prepared_indexed"
        assert raised.value.message == "prepare_index_timeout"
        _assert_safe_failure_note(raised.value.message)
        evidence.fail(raised.value.check, raised.value.message)
        blob = json.dumps(evidence.to_public_dict())
        assert smoke.STACK_SMOKE_SOURCE_BYTES.decode("utf-8") not in blob
    finally:
        subprocess.run(compose + ["down", "--volumes", "--remove-orphans"], check=False, capture_output=True, text=True)
