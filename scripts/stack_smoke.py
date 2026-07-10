from __future__ import annotations

import argparse
import http.cookiejar
import json
import os
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import HTTPCookieProcessor, Request, build_opener


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_COMPOSE_FILE = ROOT / "compose.stack.yml"
DEFAULT_ENV_FILE = ROOT / ".env.stack.local"
DEFAULT_PROJECT_NAME = "context_engine_stack"
FORBIDDEN_RESPONSE_KEYS = {"token", "password", "password_hash", "hash"}


class SmokeFailure(Exception):
    def __init__(self, check: str, message: str) -> None:
        self.check = check
        self.message = message
        super().__init__(message)


@dataclass
class CheckResult:
    name: str
    status: str
    http_status: int | None = None
    request_id: str | None = None
    elapsed_ms: int | None = None
    note: str | None = None

    def to_public_dict(self) -> dict[str, Any]:
        item: dict[str, Any] = {"check": self.name, "status": self.status}
        if self.http_status is not None:
            item["httpStatus"] = self.http_status
        if self.request_id is not None:
            item["requestId"] = self.request_id
        if self.elapsed_ms is not None:
            item["elapsedMs"] = self.elapsed_ms
        if self.note is not None:
            item["note"] = self.note
        return item


@dataclass
class Evidence:
    result: str = "passed"
    checks: list[CheckResult] = field(default_factory=list)

    def record(self, result: CheckResult) -> None:
        self.checks.append(result)
        fields = [result.status.upper(), result.name]
        if result.http_status is not None:
            fields.append(f"httpStatus={result.http_status}")
        if result.request_id is not None:
            fields.append(f"requestId={result.request_id}")
        if result.elapsed_ms is not None:
            fields.append(f"elapsedMs={result.elapsed_ms}")
        if result.note is not None:
            fields.append(f"note={result.note}")
        print(" ".join(fields))

    def fail(self, check: str, note: str) -> None:
        self.result = "failed"
        self.record(CheckResult(name=check, status="failed", note=note))

    def to_public_dict(self) -> dict[str, Any]:
        return {"result": self.result, "checks": [check.to_public_dict() for check in self.checks]}


def load_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def effective_env(env_file: Path) -> dict[str, str]:
    values = load_env_file(env_file)
    values.update({key: value for key, value in os.environ.items() if value})
    return values


def require_local_values(env: dict[str, str]) -> None:
    required = [
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "CE_ADMIN_USERNAME",
        "CE_ADMIN_PASSWORD",
        "CONFIG_ENCRYPTION_KEY",
    ]
    missing = [key for key in required if not env.get(key) or env[key].startswith("<")]
    if missing:
        raise SmokeFailure("environment", "missing_required_env:" + ",".join(missing))
    secure_cookie = env.get("CE_SESSION_COOKIE_SECURE", "false").strip().lower()
    if secure_cookie not in {"0", "false", "no", "off"}:
        raise SmokeFailure("environment", "CE_SESSION_COOKIE_SECURE_must_be_false_for_local_http")


def run_command(cmd: list[str], *, timeout: int = 120) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=ROOT,
        encoding="utf-8",
        errors="replace",
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=timeout,
        check=False,
    )


def require_command(cmd: list[str], check: str, *, timeout: int = 120) -> subprocess.CompletedProcess[str]:
    completed = run_command(cmd, timeout=timeout)
    if completed.returncode != 0:
        raise SmokeFailure(check, "command_failed")
    return completed


def compose_base(compose_file: Path, env_file: Path, project_name: str) -> list[str]:
    return [
        "docker",
        "compose",
        "--env-file",
        str(env_file),
        "-f",
        str(compose_file),
        "-p",
        project_name,
    ]


def compose_service_state(compose: list[str], service: str) -> dict[str, Any] | None:
    service_id = run_command(compose + ["ps", "--all", "-q", service], timeout=30).stdout.strip().splitlines()
    if not service_id:
        return None
    inspected = require_command(["docker", "inspect", "--format", "{{json .State}}", service_id[0]], "docker_inspect", timeout=30)
    return json.loads(inspected.stdout)


def wait_for_service_health(compose: list[str], service: str, *, timeout_seconds: int) -> None:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        state = compose_service_state(compose, service)
        health = (state or {}).get("Health", {}).get("Status")
        if health == "healthy":
            return
        if (state or {}).get("Status") == "exited" and (state or {}).get("ExitCode") not in {0, None}:
            raise SmokeFailure(service, "service_exited")
        time.sleep(2)
    raise SmokeFailure(service, "service_not_healthy")


def wait_for_service_exit_success(compose: list[str], service: str, *, timeout_seconds: int) -> None:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        state = compose_service_state(compose, service)
        if state and state.get("Status") == "exited":
            if state.get("ExitCode") == 0:
                return
            raise SmokeFailure(service, "service_failed")
        time.sleep(2)
    raise SmokeFailure(service, "service_did_not_complete")


def request_raw(
    method: str,
    url: str,
    *,
    jar: http.cookiejar.CookieJar | None = None,
    body: dict[str, Any] | None = None,
    timeout: int = 20,
) -> tuple[int, dict[str, str], bytes, int]:
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    opener = build_opener(HTTPCookieProcessor(jar)) if jar is not None else build_opener()
    request = Request(url, data=data, headers=headers, method=method)
    started = time.perf_counter()
    try:
        with opener.open(request, timeout=timeout) as response:
            payload = response.read()
            return response.status, dict(response.headers), payload, int((time.perf_counter() - started) * 1000)
    except HTTPError as exc:
        payload = exc.read()
        return exc.code, dict(exc.headers), payload, int((time.perf_counter() - started) * 1000)
    except URLError as exc:
        raise SmokeFailure("http_request", "network_error") from exc


def parse_json(payload: bytes) -> Any:
    try:
        return json.loads(payload.decode("utf-8"))
    except Exception as exc:
        raise SmokeFailure("http_response", "invalid_json") from exc


def contains_forbidden_key(value: Any) -> bool:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in FORBIDDEN_RESPONSE_KEYS:
                return True
            if contains_forbidden_key(child):
                return True
    if isinstance(value, list):
        return any(contains_forbidden_key(child) for child in value)
    return False


def assert_safe_auth_body(body: Any) -> None:
    if contains_forbidden_key(body):
        raise SmokeFailure("auth_response_safety", "forbidden_auth_key")
    user = body.get("user") if isinstance(body, dict) else None
    if not isinstance(user, dict) or user.get("role") != "administrator":
        raise SmokeFailure("auth_response_safety", "administrator_role_missing")


def check_json_endpoint(evidence: Evidence, name: str, method: str, url: str, *, jar: http.cookiejar.CookieJar | None = None, body: dict[str, Any] | None = None, expect: int = 200) -> Any:
    status, headers, payload, elapsed = request_raw(method, url, jar=jar, body=body)
    request_id = headers.get("X-Request-ID")
    if status != expect:
        raise SmokeFailure(name, f"unexpected_http_status:{status}")
    parsed = parse_json(payload)
    evidence.record(CheckResult(name=name, status="passed", http_status=status, request_id=request_id, elapsed_ms=elapsed))
    return parsed


def run_smoke(args: argparse.Namespace) -> Evidence:
    compose_file = Path(args.compose_file).resolve()
    env_file = Path(args.env_file).resolve()
    env = effective_env(env_file)
    require_local_values(env)

    compose = compose_base(compose_file, env_file, args.project_name)
    evidence = Evidence()

    if not args.skip_up:
        if args.reset_state:
            require_command(compose + ["down", "--volumes", "--remove-orphans"], "compose_reset", timeout=120)
        require_command(compose + ["up", "--build", "-d"], "compose_up", timeout=900)

    wait_for_service_health(compose, "postgres", timeout_seconds=args.timeout)
    evidence.record(CheckResult(name="postgres_health", status="passed"))

    wait_for_service_exit_success(compose, "migrate", timeout_seconds=args.timeout)
    evidence.record(CheckResult(name="alembic_head", status="passed"))

    wait_for_service_health(compose, "api", timeout_seconds=args.timeout)
    wait_for_service_health(compose, "frontend", timeout_seconds=args.timeout)

    api_url = f"http://127.0.0.1:{env.get('STACK_API_PORT', '8000')}"
    frontend_url = f"http://127.0.0.1:{env.get('STACK_FRONTEND_PORT', '3000')}"

    check_json_endpoint(evidence, "api_live", "GET", f"{api_url}/health/live")
    check_json_endpoint(evidence, "api_ready", "GET", f"{api_url}/health/ready")

    api_jar = http.cookiejar.CookieJar()
    login_body = check_json_endpoint(
        evidence,
        "api_admin_login",
        "POST",
        f"{api_url}/api/v1/auth/login",
        jar=api_jar,
        body={"username": env["CE_ADMIN_USERNAME"], "password": env["CE_ADMIN_PASSWORD"]},
    )
    assert_safe_auth_body(login_body)
    me_body = check_json_endpoint(evidence, "api_auth_me", "GET", f"{api_url}/api/v1/auth/me", jar=api_jar)
    assert_safe_auth_body(me_body)

    status, headers, _payload, elapsed = request_raw("GET", f"{frontend_url}/login")
    if status != 200:
        raise SmokeFailure("frontend_login_route", f"unexpected_http_status:{status}")
    evidence.record(
        CheckResult(
            name="frontend_login_route",
            status="passed",
            http_status=status,
            request_id=headers.get("X-Request-ID"),
            elapsed_ms=elapsed,
        )
    )

    frontend_jar = http.cookiejar.CookieJar()
    frontend_login = check_json_endpoint(
        evidence,
        "frontend_proxy_admin_login",
        "POST",
        f"{frontend_url}/api/v1/auth/login",
        jar=frontend_jar,
        body={"username": env["CE_ADMIN_USERNAME"], "password": env["CE_ADMIN_PASSWORD"]},
    )
    assert_safe_auth_body(frontend_login)
    frontend_me = check_json_endpoint(
        evidence,
        "frontend_proxy_auth_me",
        "GET",
        f"{frontend_url}/api/v1/auth/me",
        jar=frontend_jar,
    )
    assert_safe_auth_body(frontend_me)

    return evidence


def write_evidence(path: str | None, evidence: Evidence) -> None:
    if not path:
        return
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(evidence.to_public_dict(), indent=2, sort_keys=True) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the stack HTTP smoke against listening services.")
    parser.add_argument("--compose-file", default=str(DEFAULT_COMPOSE_FILE))
    parser.add_argument("--env-file", default=str(DEFAULT_ENV_FILE))
    parser.add_argument("--project-name", default=DEFAULT_PROJECT_NAME)
    parser.add_argument("--timeout", type=int, default=180)
    parser.add_argument("--skip-up", action="store_true", help="Check an already running stack.")
    parser.add_argument("--reset-state", action="store_true", help="Explicitly remove this compose project's volumes before start.")
    parser.add_argument("--keep-running", action="store_true", help="Leave services running after the smoke.")
    parser.add_argument("--write-evidence", default=None, help="Optional safe JSON evidence output path.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    evidence = Evidence()
    compose = compose_base(Path(args.compose_file).resolve(), Path(args.env_file).resolve(), args.project_name)
    try:
        evidence = run_smoke(args)
        write_evidence(args.write_evidence, evidence)
        return 0
    except SmokeFailure as exc:
        evidence.fail(exc.check, exc.message)
        write_evidence(args.write_evidence, evidence)
        return 1
    finally:
        if not args.keep_running and not args.skip_up:
            run_command(compose + ["down", "--remove-orphans"], timeout=120)


if __name__ == "__main__":
    sys.exit(main())
