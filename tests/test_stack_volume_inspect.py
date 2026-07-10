from __future__ import annotations

import importlib.util
import json
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


inspect = _load("stack_volume_inspect", "scripts/stack_volume_inspect.py")


def test_build_report_handles_zero_matching_volumes() -> None:
    report = inspect.build_report(set())
    assert report["result"] == "ok"
    assert len(report["volumes"]) == 6
    assert all(item["exists"] is False for item in report["volumes"])
    blob = json.dumps(report)
    assert "Mountpoint" not in blob
    assert "/var/lib/docker" not in blob


def test_parse_size_to_bytes() -> None:
    assert inspect._parse_size_to_bytes("1.5GB") == 1_500_000_000
    assert inspect._parse_size_to_bytes("2MiB") == 2 * 1024 * 1024
    assert inspect._parse_size_to_bytes("N/A") is None


def test_main_exits_nonzero_when_docker_unavailable(monkeypatch) -> None:
    monkeypatch.setattr(inspect, "docker_available", lambda: False)
    assert inspect.main([]) == 2
