from __future__ import annotations

import argparse
import http.cookiejar
import sys
from pathlib import Path

# Reuse HTTP helpers from the default stack smoke without importing worker code.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import stack_smoke as smoke  # noqa: E402

DEFAULT_COMPOSE_FILE = ROOT / "compose.stack.yml"
DEFAULT_LIVE_COMPOSE_FILE = ROOT / "compose.stack.live.yml"
DEFAULT_ENV_FILE = ROOT / ".env.stack.local"
DEFAULT_PROJECT_NAME = "context_engine_stack_live"
DEFAULT_EVIDENCE_PATH = ROOT / "_tmp" / "stack-smoke-live.json"


def require_live_prerequisites(env: dict[str, str]) -> str:
    smoke.require_local_values(env)
    runtime_root = (env.get("CE_STACK_LIVE_RUNTIME_ROOT") or "").strip()
    if not runtime_root or runtime_root.startswith("<"):
        raise smoke.SmokeFailure("environment", "missing_CE_STACK_LIVE_RUNTIME_ROOT")
    if not Path(runtime_root).is_absolute():
        raise smoke.SmokeFailure("environment", "CE_STACK_LIVE_RUNTIME_ROOT_must_be_absolute")
    if not DEFAULT_LIVE_COMPOSE_FILE.exists():
        raise smoke.SmokeFailure("environment", "live_overlay_missing")
    return runtime_root


def _env_map_from_compose_config(text: str) -> dict[str, str]:
    """Best-effort extract of service environment from `docker compose config` YAML."""
    values: dict[str, str] = {}
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or ":" not in stripped:
            continue
        key, raw = stripped.split(":", 1)
        key = key.strip()
        if key in {
            "CE_DOMAIN_RUNTIME_CONTROLLER_KIND",
            "CE_LIGHTRAG_CLIENT_KIND",
            "CE_DOMAIN_RUNTIME_ROOT",
            "CE_DOMAIN_CONTROLLER_COMMAND",
        }:
            values[key] = raw.strip().strip('"').strip("'")
    return values


def assert_live_kinds_from_compose_config(compose: list[str], evidence: smoke.Evidence) -> None:
    completed = smoke.require_command(compose + ["config"], "live_compose_config", timeout=120)
    text = completed.stdout
    env_map = _env_map_from_compose_config(text)
    if env_map.get("CE_DOMAIN_RUNTIME_CONTROLLER_KIND") != "docker":
        raise smoke.SmokeFailure("live_kinds", "controller_kind_not_docker")
    if env_map.get("CE_LIGHTRAG_CLIENT_KIND") != "native":
        raise smoke.SmokeFailure("live_kinds", "lightrag_kind_not_native")
    if "docker.sock" not in text:
        raise smoke.SmokeFailure("live_kinds", "docker_sock_not_mounted")
    evidence.record(
        smoke.CheckResult(
            name="live_kinds_active",
            status="passed",
            note="controller=docker;lightrag=native;overlay=compose.stack.live.yml",
        )
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Optional live Docker LightRAG stack smoke (not the default F-010 gate)."
    )
    parser.add_argument("--compose-file", default=str(DEFAULT_COMPOSE_FILE))
    parser.add_argument("--live-compose-file", default=str(DEFAULT_LIVE_COMPOSE_FILE))
    parser.add_argument("--env-file", default=str(DEFAULT_ENV_FILE))
    parser.add_argument("--project-name", default=DEFAULT_PROJECT_NAME)
    parser.add_argument("--timeout", type=int, default=300, help="Health/migrate wait timeout in seconds.")
    parser.add_argument(
        "--pilot-timeout",
        type=int,
        default=600,
        help="Timeout for prepare/index polling in seconds (native index is slower than local-fake).",
    )
    parser.add_argument("--skip-up", action="store_true", help="Check an already running live stack.")
    parser.add_argument("--reset-state", action="store_true", help="Remove this compose project's volumes before start.")
    parser.add_argument("--keep-running", action="store_true", help="Leave services running after the smoke.")
    parser.add_argument(
        "--include-chat",
        action="store_true",
        help="Continue past evidence into chat/delete (default is bounded evidence path only).",
    )
    parser.add_argument(
        "--write-evidence",
        default=str(DEFAULT_EVIDENCE_PATH),
        help="Safe JSON evidence output path.",
    )
    return parser.parse_args()


def run_live_smoke(args: argparse.Namespace) -> smoke.Evidence:
    compose_file = Path(args.compose_file).resolve()
    live_compose_file = Path(args.live_compose_file).resolve()
    env_file = Path(args.env_file).resolve()
    env = smoke.effective_env(env_file)
    runtime_root = require_live_prerequisites(env)
    Path(runtime_root).mkdir(parents=True, exist_ok=True)

    compose = smoke.compose_base(
        compose_file,
        env_file,
        args.project_name,
        extra_compose_files=[live_compose_file],
    )
    evidence = smoke.Evidence()
    assert_live_kinds_from_compose_config(compose, evidence)

    if not args.skip_up:
        if args.reset_state:
            smoke.require_command(compose + ["down", "--volumes", "--remove-orphans"], "compose_reset", timeout=120)
        smoke.require_command(compose + ["up", "--build", "-d"], "compose_up", timeout=1200)

    smoke.wait_for_service_health(compose, "postgres", timeout_seconds=args.timeout)
    evidence.record(smoke.CheckResult(name="postgres_health", status="passed"))
    smoke.wait_for_service_exit_success(compose, "migrate", timeout_seconds=args.timeout)
    evidence.record(smoke.CheckResult(name="alembic_head", status="passed"))
    smoke.wait_for_service_health(compose, "api", timeout_seconds=args.timeout)
    smoke.wait_for_service_health(compose, "frontend", timeout_seconds=args.timeout)

    api_url = f"http://127.0.0.1:{env.get('STACK_API_PORT', '8000')}"
    api_jar = http.cookiejar.CookieJar()
    login_body = smoke.check_json_endpoint(
        evidence,
        "api_admin_login",
        "POST",
        f"{api_url}/api/v1/auth/login",
        jar=api_jar,
        body={"username": env["CE_ADMIN_USERNAME"], "password": env["CE_ADMIN_PASSWORD"]},
    )
    smoke.assert_safe_auth_body(login_body)

    smoke.run_pilot_path_http(
        evidence,
        api_url=api_url,
        jar=api_jar,
        compose=compose,
        pilot_timeout_seconds=args.pilot_timeout,
        through_evidence_only=not args.include_chat,
    )
    evidence.record(
        smoke.CheckResult(
            name="live_gate",
            status="passed",
            note="not_default_f010_gate",
        )
    )
    return evidence


def main() -> int:
    args = parse_args()
    evidence = smoke.Evidence()
    compose_file = Path(args.compose_file).resolve()
    live_compose_file = Path(args.live_compose_file).resolve()
    env_file = Path(args.env_file).resolve()
    compose = smoke.compose_base(
        compose_file,
        env_file,
        args.project_name,
        extra_compose_files=[live_compose_file],
    )
    try:
        evidence = run_live_smoke(args)
        smoke.write_evidence(args.write_evidence, evidence)
        return 0
    except smoke.SmokeFailure as exc:
        evidence.fail(exc.check, exc.message)
        smoke.write_evidence(args.write_evidence, evidence)
        return 1
    finally:
        if not args.keep_running and not args.skip_up:
            smoke.run_command(compose + ["down", "--remove-orphans"], timeout=120)


if __name__ == "__main__":
    raise SystemExit(main())
