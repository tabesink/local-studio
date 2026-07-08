from __future__ import annotations

from pathlib import Path

TARGETS = [
    Path("tests/snapshots/f008_openapi.json"),
]

FORBIDDEN_PUBLIC_STRINGS = [
    "sk-audit-route-secret",
    "sk-rollback-secret",
    "raw provider payload",
    "raw lightrag payload",
    "traceback (most recent call last)",
    "runtime-db",
    "container.json",
]


def main() -> int:
    failures: list[str] = []
    for target in TARGETS:
        if not target.exists():
            failures.append(f"missing:{target}")
            continue
        text = target.read_text(encoding="utf-8").lower()
        for needle in FORBIDDEN_PUBLIC_STRINGS:
            if needle.lower() in text:
                failures.append(f"{target}:{needle}")
    if failures:
        for failure in failures:
            print(failure)
        return 1
    print("secret_scan: ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
