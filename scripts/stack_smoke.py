from __future__ import annotations

import argparse
import http.cookiejar
import json
import os
import subprocess
import sys
import time
import uuid
from collections.abc import Callable
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
STACK_SMOKE_DOMAIN_ID = "stack"
STACK_SMOKE_PROVIDER_CREDENTIAL = "stack-smoke-credential"
STACK_SMOKE_SOURCE_BYTES = b"# Stack Smoke Manual\nUse lockout and inspection before startup.\n"
STACK_SMOKE_QUESTION = "What does startup require?"


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


def wait_for_service_running(compose: list[str], service: str, *, timeout_seconds: int) -> None:
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        state = compose_service_state(compose, service)
        if state and state.get("Status") == "running":
            return
        if state and state.get("Status") == "exited" and state.get("ExitCode") not in {0, None}:
            raise SmokeFailure(service, "service_exited")
        time.sleep(2)
    raise SmokeFailure(service, "service_not_running")


def encode_multipart_file(
    field_name: str,
    filename: str,
    content: bytes,
    content_type: str,
) -> tuple[bytes, str]:
    boundary = f"----CEStackSmokeBoundary{uuid.uuid4().hex}"
    disposition = f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"'
    parts = [
        f"--{boundary}".encode("ascii"),
        disposition.encode("utf-8"),
        f"Content-Type: {content_type}".encode("utf-8"),
        b"",
        content,
        f"--{boundary}--".encode("ascii"),
        b"",
    ]
    body = b"\r\n".join(parts)
    return body, f"multipart/form-data; boundary={boundary}"


def request_raw(
    method: str,
    url: str,
    *,
    jar: http.cookiejar.CookieJar | None = None,
    body: dict[str, Any] | None = None,
    multipart_file: tuple[str, str, bytes, str] | None = None,
    accept: str = "application/json",
    timeout: int = 20,
) -> tuple[int, dict[str, str], bytes, int]:
    if body is not None and multipart_file is not None:
        raise SmokeFailure("http_request", "conflicting_body_and_multipart")
    data = None
    headers = {"Accept": accept}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif multipart_file is not None:
        field_name, filename, content, content_type = multipart_file
        data, content_type_header = encode_multipart_file(field_name, filename, content, content_type)
        headers["Content-Type"] = content_type_header
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


def parse_sse_events(text: str) -> list[tuple[str, dict[str, Any]]]:
    events: list[tuple[str, dict[str, Any]]] = []
    for block in text.strip().split("\n\n"):
        if not block:
            continue
        event_name = ""
        data = ""
        for line in block.splitlines():
            if line.startswith("event: "):
                event_name = line.removeprefix("event: ")
            elif line.startswith("data: "):
                data = line.removeprefix("data: ")
        if not data:
            continue
        events.append((event_name, json.loads(data)))
    return events


def source_is_prepared_and_indexed(source: dict[str, Any]) -> bool:
    return source.get("state") == "prepared" and source.get("indexState") == "ready"


def poll_until(
    predicate: Callable[[Any], bool],
    fetch: Callable[[], Any],
    *,
    timeout_seconds: float,
    interval_seconds: float,
    sleep_fn: Callable[[float], None] = time.sleep,
) -> Any:
    deadline = time.monotonic() + timeout_seconds
    while True:
        value = fetch()
        if predicate(value):
            return value
        if time.monotonic() >= deadline:
            raise TimeoutError("poll_until_timeout")
        sleep_fn(interval_seconds)


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


def assert_safe_json(body: Any, check: str) -> None:
    if contains_forbidden_key(body):
        raise SmokeFailure(check, "forbidden_response_key")
    serialized = json.dumps(body, sort_keys=True)
    if STACK_SMOKE_PROVIDER_CREDENTIAL in serialized:
        raise SmokeFailure(check, "credential_leaked")


def check_json_endpoint(
    evidence: Evidence,
    name: str,
    method: str,
    url: str,
    *,
    jar: http.cookiejar.CookieJar | None = None,
    body: dict[str, Any] | None = None,
    expect: int = 200,
    timeout: int = 20,
) -> Any:
    status, headers, payload, elapsed = request_raw(method, url, jar=jar, body=body, timeout=timeout)
    request_id = headers.get("X-Request-ID")
    if status != expect:
        raise SmokeFailure(name, f"unexpected_http_status:{status}")
    parsed = parse_json(payload)
    evidence.record(CheckResult(name=name, status="passed", http_status=status, request_id=request_id, elapsed_ms=elapsed))
    return parsed


def check_empty_endpoint(
    evidence: Evidence,
    name: str,
    method: str,
    url: str,
    *,
    jar: http.cookiejar.CookieJar | None = None,
    expect: int = 204,
    timeout: int = 20,
) -> None:
    status, headers, _payload, elapsed = request_raw(method, url, jar=jar, timeout=timeout)
    request_id = headers.get("X-Request-ID")
    if status != expect:
        raise SmokeFailure(name, f"unexpected_http_status:{status}")
    evidence.record(CheckResult(name=name, status="passed", http_status=status, request_id=request_id, elapsed_ms=elapsed))


def run_pilot_path_http(
    evidence: Evidence,
    *,
    api_url: str,
    jar: http.cookiejar.CookieJar,
    compose: list[str] | None = None,
    pilot_timeout_seconds: int = 180,
    poll_interval_seconds: float = 2.0,
    after_source_upload: Callable[[], None] | None = None,
) -> None:
    if compose is not None:
        wait_for_service_health(compose, "worker", timeout_seconds=min(60, pilot_timeout_seconds))
        evidence.record(CheckResult(name="worker_healthy", status="passed"))

    provider = check_json_endpoint(
        evidence,
        "provider_config",
        "PUT",
        f"{api_url}/api/v1/admin/runtime-settings/providers/openai",
        jar=jar,
        body={"credential": STACK_SMOKE_PROVIDER_CREDENTIAL},
    )
    assert_safe_json(provider, "provider_config")

    created = check_json_endpoint(
        evidence,
        "domain_create",
        "POST",
        f"{api_url}/api/v1/admin/domains",
        jar=jar,
        body={
            "id": STACK_SMOKE_DOMAIN_ID,
            "displayName": "Stack Smoke",
            "embeddingProfileId": "openai-embedding-default",
        },
        expect=201,
    )
    assert_safe_json(created, "domain_create")

    started = check_json_endpoint(
        evidence,
        "domain_ready",
        "POST",
        f"{api_url}/api/v1/admin/domains/{STACK_SMOKE_DOMAIN_ID}/start",
        jar=jar,
    )
    assert_safe_json(started, "domain_ready")

    status, headers, payload, elapsed = request_raw(
        "POST",
        f"{api_url}/api/v1/admin/domains/{STACK_SMOKE_DOMAIN_ID}/sources",
        jar=jar,
        multipart_file=("file", "manual.md", STACK_SMOKE_SOURCE_BYTES, "text/markdown"),
        timeout=60,
    )
    if status != 201:
        raise SmokeFailure("source_upload", f"unexpected_http_status:{status}")
    uploaded = parse_json(payload)
    assert_safe_json(uploaded, "source_upload")
    source = uploaded.get("source") if isinstance(uploaded, dict) else None
    if not isinstance(source, dict) or not source.get("id"):
        raise SmokeFailure("source_upload", "source_id_missing")
    source_id = str(source["id"])
    evidence.record(
        CheckResult(
            name="source_upload",
            status="passed",
            http_status=status,
            request_id=headers.get("X-Request-ID"),
            elapsed_ms=elapsed,
        )
    )
    if after_source_upload is not None:
        after_source_upload()

    def fetch_source() -> dict[str, Any]:
        get_status, _get_headers, get_payload, _get_elapsed = request_raw(
            "GET",
            f"{api_url}/api/v1/admin/domains/{STACK_SMOKE_DOMAIN_ID}/sources/{source_id}",
            jar=jar,
        )
        if get_status != 200:
            raise SmokeFailure("source_prepared_indexed", f"unexpected_http_status:{get_status}")
        body = parse_json(get_payload)
        assert_safe_json(body, "source_prepared_indexed")
        source_body = body.get("source") if isinstance(body, dict) else None
        if not isinstance(source_body, dict):
            raise SmokeFailure("source_prepared_indexed", "source_missing")
        return source_body

    try:
        ready_source = poll_until(
            source_is_prepared_and_indexed,
            fetch_source,
            timeout_seconds=pilot_timeout_seconds,
            interval_seconds=poll_interval_seconds,
        )
    except TimeoutError as exc:
        raise SmokeFailure("source_prepared_indexed", "prepare_index_timeout") from exc
    evidence.record(
        CheckResult(
            name="source_prepared_indexed",
            status="passed",
            note=f"state={ready_source.get('state')};indexState={ready_source.get('indexState')}",
        )
    )

    evidence_status, evidence_headers, evidence_payload, evidence_elapsed = request_raw(
        "POST",
        f"{api_url}/api/v1/domains/{STACK_SMOKE_DOMAIN_ID}/evidence",
        jar=jar,
        body={"question": STACK_SMOKE_QUESTION},
        timeout=60,
    )
    if evidence_status != 200:
        raise SmokeFailure("evidence_retrieve", f"unexpected_http_status:{evidence_status}")
    evidence_body = parse_json(evidence_payload)
    assert_safe_json(evidence_body, "evidence_retrieve")
    if not isinstance(evidence_body, dict) or evidence_body.get("result") != "evidence_found":
        raise SmokeFailure("evidence_retrieve", "evidence_not_found")
    if not evidence_body.get("evidence"):
        raise SmokeFailure("evidence_retrieve", "evidence_empty")
    evidence.record(
        CheckResult(
            name="evidence_retrieve",
            status="passed",
            http_status=evidence_status,
            request_id=evidence_headers.get("X-Request-ID"),
            elapsed_ms=evidence_elapsed,
            note="result=evidence_found",
        )
    )

    conversation = check_json_endpoint(
        evidence,
        "conversation_create",
        "POST",
        f"{api_url}/api/v1/conversations",
        jar=jar,
        body={"title": "Stack Smoke"},
        expect=201,
    )
    assert_safe_json(conversation, "conversation_create")
    conversation_obj = conversation.get("conversation") if isinstance(conversation, dict) else None
    if not isinstance(conversation_obj, dict) or not conversation_obj.get("id"):
        raise SmokeFailure("conversation_create", "conversation_id_missing")
    conversation_id = str(conversation_obj["id"])

    turn_status, turn_headers, turn_payload, turn_elapsed = request_raw(
        "POST",
        f"{api_url}/api/v1/conversations/{conversation_id}/turns:stream",
        jar=jar,
        body={
            "clientRequestId": "stack-smoke-turn-0001",
            "message": STACK_SMOKE_QUESTION,
            "domainId": STACK_SMOKE_DOMAIN_ID,
        },
        accept="text/event-stream",
        timeout=max(60, pilot_timeout_seconds),
    )
    if turn_status != 200:
        raise SmokeFailure("domain_chat", f"unexpected_http_status:{turn_status}")
    turn_text = turn_payload.decode("utf-8", errors="replace")
    if STACK_SMOKE_PROVIDER_CREDENTIAL in turn_text:
        raise SmokeFailure("domain_chat", "credential_leaked")
    events = parse_sse_events(turn_text)
    if not events:
        raise SmokeFailure("domain_chat", "sse_events_missing")
    terminal = events[-1][1]
    if terminal.get("stopReason") != "grounded":
        raise SmokeFailure("domain_chat", f"unexpected_stop_reason:{terminal.get('stopReason')}")
    evidence.record(
        CheckResult(
            name="domain_chat",
            status="passed",
            http_status=turn_status,
            request_id=turn_headers.get("X-Request-ID"),
            elapsed_ms=turn_elapsed,
            note="stopReason=grounded",
        )
    )

    check_empty_endpoint(
        evidence,
        "source_delete",
        "DELETE",
        f"{api_url}/api/v1/admin/domains/{STACK_SMOKE_DOMAIN_ID}/sources/{source_id}",
        jar=jar,
        expect=204,
        timeout=60,
    )
    detail_status, detail_headers, detail_payload, detail_elapsed = request_raw(
        "GET",
        f"{api_url}/api/v1/conversations/{conversation_id}",
        jar=jar,
    )
    if detail_status != 200:
        raise SmokeFailure("source_delete_redaction", f"unexpected_http_status:{detail_status}")
    detail = parse_json(detail_payload)
    assert_safe_json(detail, "source_delete_redaction")
    turns = detail.get("turns") if isinstance(detail, dict) else None
    if not isinstance(turns, list) or not turns:
        raise SmokeFailure("source_delete_redaction", "turns_missing")
    turn = turns[0]
    if not isinstance(turn, dict) or turn.get("status") != "redacted":
        raise SmokeFailure("source_delete_redaction", "turn_not_redacted")
    if turn.get("assistantAnswer") is not None or turn.get("evidence") != []:
        raise SmokeFailure("source_delete_redaction", "turn_content_not_cleared")
    evidence.record(
        CheckResult(
            name="source_delete_redaction",
            status="passed",
            http_status=detail_status,
            request_id=detail_headers.get("X-Request-ID"),
            elapsed_ms=detail_elapsed,
            note="turnStatus=redacted",
        )
    )

    deleted = check_json_endpoint(
        evidence,
        "domain_delete_accept",
        "DELETE",
        f"{api_url}/api/v1/admin/domains/{STACK_SMOKE_DOMAIN_ID}",
        jar=jar,
        expect=202,
        timeout=60,
    )
    assert_safe_json(deleted, "domain_delete_accept")

    def domain_gone() -> int:
        gone_status, _gone_headers, _gone_payload, _gone_elapsed = request_raw(
            "GET",
            f"{api_url}/api/v1/admin/domains/{STACK_SMOKE_DOMAIN_ID}",
            jar=jar,
        )
        return gone_status

    try:
        poll_until(
            lambda status_code: status_code == 404,
            domain_gone,
            timeout_seconds=pilot_timeout_seconds,
            interval_seconds=poll_interval_seconds,
        )
    except TimeoutError as exc:
        raise SmokeFailure("domain_delete", "domain_delete_timeout") from exc
    evidence.record(CheckResult(name="domain_delete", status="passed", note="domain_gone"))


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

    run_pilot_path_http(
        evidence,
        api_url=api_url,
        jar=api_jar,
        compose=compose,
        pilot_timeout_seconds=args.pilot_timeout,
    )

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
    parser.add_argument("--timeout", type=int, default=180, help="Health/migrate wait timeout in seconds.")
    parser.add_argument(
        "--pilot-timeout",
        type=int,
        default=180,
        help="Timeout for prepare/index and domain-delete polling in seconds.",
    )
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
