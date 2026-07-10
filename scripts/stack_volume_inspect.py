from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from typing import Any


P10_VOLUMES = (
    "p10-postgres-data",
    "p10-source-storage",
    "p10-domain-runtimes",
)
STACK_VOLUMES = (
    "stack-postgres-data",
    "stack-source-storage",
    "stack-domain-runtimes",
)
ALL_VOLUME_NAMES = P10_VOLUMES + STACK_VOLUMES


def docker_available() -> bool:
    docker = shutil.which("docker")
    if docker is None:
        return False
    result = subprocess.run([docker, "info"], text=True, capture_output=True, check=False)
    return result.returncode == 0


def list_volume_names() -> set[str]:
    completed = subprocess.run(
        ["docker", "volume", "ls", "--format", "{{.Name}}"],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError("docker_volume_ls_failed")
    return {line.strip() for line in completed.stdout.splitlines() if line.strip()}


def inspect_volume(name: str) -> dict[str, Any]:
    completed = subprocess.run(
        ["docker", "volume", "inspect", name, "--format", "{{json .}}"],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(f"docker_volume_inspect_failed:{name}")
    payload = json.loads(completed.stdout)
    labels = payload.get("Labels") or {}
    if not isinstance(labels, dict):
        labels = {}
    # Never include Mountpoint / host paths in default output.
    return {
        "name": name,
        "exists": True,
        "driver": payload.get("Driver"),
        "labels": {str(key): str(value) for key, value in labels.items()},
        "sizeBytes": _volume_size_bytes(name),
    }


def _volume_size_bytes(name: str) -> int | None:
    # Best-effort; some Docker setups omit Size. Never print Mountpoint.
    completed = subprocess.run(
        ["docker", "system", "df", "-v", "--format", "{{.Name}}\t{{.Size}}"],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        return None
    for line in completed.stdout.splitlines():
        if not line.startswith(f"{name}\t"):
            continue
        raw = line.split("\t", 1)[1].strip()
        return _parse_size_to_bytes(raw)
    return None


def _parse_size_to_bytes(raw: str) -> int | None:
    text = raw.strip().upper().replace(" ", "")
    if not text or text == "N/A":
        return None
    multipliers = {
        "B": 1,
        "KB": 1000,
        "MB": 1000**2,
        "GB": 1000**3,
        "TB": 1000**4,
        "KIB": 1024,
        "MIB": 1024**2,
        "GIB": 1024**3,
        "TIB": 1024**4,
    }
    for suffix, factor in sorted(multipliers.items(), key=lambda item: -len(item[0])):
        if text.endswith(suffix):
            number = text[: -len(suffix)]
            try:
                return int(float(number) * factor)
            except ValueError:
                return None
    try:
        return int(float(text))
    except ValueError:
        return None


def build_report(existing: set[str]) -> dict[str, Any]:
    volumes: list[dict[str, Any]] = []
    for name in ALL_VOLUME_NAMES:
        if name in existing:
            volumes.append(inspect_volume(name))
        else:
            volumes.append({"name": name, "exists": False, "driver": None, "labels": {}, "sizeBytes": None})
    return {
        "result": "ok",
        "families": {
            "p10": [item for item in volumes if item["name"].startswith("p10-")],
            "stack": [item for item in volumes if item["name"].startswith("stack-")],
        },
        "volumes": volumes,
        "notes": [
            "Read-only inspect; no volumes were modified.",
            "Host volume paths are omitted by design.",
            "See RUN-001 volume migration decision tree for preserve vs fresh-start steps.",
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Read-only inspect of former p10-* and current stack-* Docker volumes (no secrets, no Mountpoints)."
    )
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")
    args = parser.parse_args(argv)

    if not docker_available():
        message = "stack_volume_inspect: docker_unavailable"
        print(message, file=sys.stderr)
        return 2

    try:
        existing = list_volume_names()
        report = build_report(existing)
    except Exception as exc:  # noqa: BLE001 - operator-facing script; keep message safe
        print(f"stack_volume_inspect: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
        return 0

    print("stack_volume_inspect: ok")
    for item in report["volumes"]:
        status = "present" if item["exists"] else "missing"
        size = item.get("sizeBytes")
        size_note = f" sizeBytes={size}" if size is not None else ""
        print(f"  {item['name']}: {status}{size_note}")
    for note in report["notes"]:
        print(f"note: {note}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
