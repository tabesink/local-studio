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


smoke = _load("stack_smoke_helpers", "scripts/stack_smoke.py")


def test_parse_sse_events_reads_event_and_data_blocks() -> None:
    text = (
        "event: turn.started\n"
        'data: {"turnId":"t1"}\n'
        "\n"
        "event: turn.completed\n"
        'data: {"turnId":"t1","stopReason":"grounded"}\n'
        "\n"
    )
    events = smoke.parse_sse_events(text)
    assert events == [
        ("turn.started", {"turnId": "t1"}),
        ("turn.completed", {"turnId": "t1", "stopReason": "grounded"}),
    ]


def test_source_is_prepared_and_indexed() -> None:
    assert smoke.source_is_prepared_and_indexed({"state": "prepared", "indexState": "ready"}) is True
    assert smoke.source_is_prepared_and_indexed({"state": "pending", "indexState": "ready"}) is False
    assert smoke.source_is_prepared_and_indexed({"state": "prepared", "indexState": "queued"}) is False
    assert smoke.source_is_prepared_and_indexed({}) is False


def test_poll_until_returns_when_predicate_matches() -> None:
    calls = {"n": 0}
    sleeps: list[float] = []

    def fetch() -> int:
        calls["n"] += 1
        return calls["n"]

    value = smoke.poll_until(
        lambda n: n >= 3,
        fetch,
        timeout_seconds=10,
        interval_seconds=0.5,
        sleep_fn=sleeps.append,
    )
    assert value == 3
    assert sleeps == [0.5, 0.5]


def test_poll_until_raises_on_timeout() -> None:
    with pytest.raises(TimeoutError):
        smoke.poll_until(
            lambda _: False,
            lambda: {"state": "pending"},
            timeout_seconds=0.01,
            interval_seconds=0.001,
            sleep_fn=lambda _: None,
        )
