from __future__ import annotations

import argparse
import re
import shlex
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

DEFAULT_TARGETS = [
    Path("compose.stack.yml"),
    Path(".env.stack.example"),
    Path(".dockerignore"),
    Path("Dockerfile"),
    Path("frontend/Dockerfile"),
    Path("frontend/.dockerignore"),
    Path("frontend/package.json"),
    Path("scripts/stack_smoke.py"),
    Path("scripts/stack_safety_scan.py"),
    Path("specs/06-delivery/runbooks/pilot-launch.md"),
    Path("specs/04-features/F-010-shared-node-operations/spec.md"),
    Path("specs/04-features/F-010-shared-node-operations/plan.md"),
    Path("specs/04-features/F-010-shared-node-operations/tasks.md"),
    Path("specs/04-features/F-010-shared-node-operations/test-plan.md"),
    Path("specs/04-features/F-010-shared-node-operations/acceptance.md"),
    Path("specs/04-features/F-010-shared-node-operations/implementation-log.md"),
    Path("specs/07-traceability/feature-register.md"),
]

SECRET_PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"sk-[A-Za-z0-9_-]{20,}"),
    re.compile(r"\$argon2id\$"),
    re.compile(r"-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----"),
    re.compile(r"Traceback \(most recent call last\)", re.IGNORECASE),
    re.compile(r"ce_session=[A-Za-z0-9_.:-]{12,}", re.IGNORECASE),
    re.compile(r"postgresql\+psycopg://[^$\n<{}]*:[^$\n<{}]+@"),
]

SECRET_ASSIGNMENT = re.compile(r"^\s*(CE_ADMIN_PASSWORD|POSTGRES_PASSWORD|CONFIG_ENCRYPTION_KEY)\s*[:=]\s*(.+?)\s*$")

# Ban job-platform / old-control-plane services. The CE lease poller service
# named `worker` is allowed; Redis/RQ/Celery and legacy pollers are not.
COMPOSE_FORBIDDEN_PATTERNS = [
    re.compile(r"(?m)^  (?:redis|status-poller|deployment-control):"),
    re.compile(r"(?<!CONTEXT_ENGINE_)DATABASE_URL"),
    re.compile(r"\bREDIS_URL\b"),
    re.compile(r"\b(?:celery|rq)\b", re.IGNORECASE),
    re.compile(r"app\.main:create_app"),
    re.compile(r"docker\.sock"),
    re.compile(r"LIGHTRAG_(?:DEPLOY|RUNTIME_URL|DOCKER)"),
    re.compile(r"context-engine-postgres-age-vector"),
]

REQUIRED_WORKER_COMMAND = ["python", "-m", "context_engine.worker"]


def _strip_yaml_scalar(value: str) -> str:
    return value.strip().strip('"').strip("'")


def _parse_inline_command(value: str) -> list[str]:
    stripped = value.strip()
    if stripped.startswith("[") and stripped.endswith("]"):
        return [_strip_yaml_scalar(item) for item in stripped[1:-1].split(",") if item.strip()]
    return shlex.split(_strip_yaml_scalar(stripped))


def _worker_service_block(text: str) -> list[str] | None:
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if line == "  worker:":
            block: list[str] = []
            for candidate in lines[index + 1 :]:
                if candidate.startswith("  ") and not candidate.startswith("    ") and candidate.strip():
                    break
                block.append(candidate)
            return block
    return None


def _worker_command_tokens(block: list[str]) -> list[str] | None:
    for index, line in enumerate(block):
        match = re.match(r"^    command:\s*(.*?)\s*$", line)
        if not match:
            continue
        value = match.group(1)
        if value:
            return _parse_inline_command(value)

        tokens: list[str] = []
        for candidate in block[index + 1 :]:
            item = re.match(r"^      -\s*(.*?)\s*$", candidate)
            if not item:
                break
            tokens.append(_strip_yaml_scalar(item.group(1)))
        return tokens or None
    return None


def scan_text(path: Path, text: str, failures: list[str]) -> None:
    for pattern in SECRET_PATTERNS:
        if pattern.search(text):
            failures.append(f"{path}:{pattern.pattern}")
    for line in text.splitlines():
        match = SECRET_ASSIGNMENT.match(line)
        if not match:
            continue
        value = match.group(2).strip().strip('"').strip("'")
        if value and not value.startswith(("<", "${")):
            failures.append(f"{path}:concrete_secret_value")


def scan_compose(path: Path, text: str, failures: list[str]) -> None:
    for pattern in COMPOSE_FORBIDDEN_PATTERNS:
        if pattern.search(text):
            failures.append(f"{path}:compose_forbidden:{pattern.pattern}")
    worker_block = _worker_service_block(text)
    if worker_block is None:
        failures.append(f"{path}:worker_service_missing")
        return
    worker_command = _worker_command_tokens(worker_block)
    if worker_command is None:
        failures.append(f"{path}:worker_command_missing")
        return
    if worker_command != REQUIRED_WORKER_COMMAND:
        failures.append(f"{path}:worker_command_invalid")


def main() -> int:
    parser = argparse.ArgumentParser(description="Scan stack deployment fixtures and safe evidence for forbidden leakage.")
    parser.add_argument("--smoke-evidence", action="append", default=[], help="Optional safe smoke evidence JSON path to scan.")
    args = parser.parse_args()

    targets = DEFAULT_TARGETS + [Path(item) for item in args.smoke_evidence]
    failures: list[str] = []

    for relative in targets:
        path = (ROOT / relative).resolve() if not relative.is_absolute() else relative
        if not path.exists():
            failures.append(f"{relative}:missing")
            continue
        text = path.read_text(encoding="utf-8")
        display = path.relative_to(ROOT) if path.is_relative_to(ROOT) else path
        scan_text(display, text, failures)
        if display == Path("compose.stack.yml"):
            scan_compose(display, text, failures)

    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("stack_safety_scan: ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
