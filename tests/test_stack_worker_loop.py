from __future__ import annotations

import pytest

from context_engine.config import Settings
from context_engine.worker import WORKER_HEARTBEAT_FILENAME, build_workers, run_loop, run_once_pass, touch_worker_heartbeat


class _FakeWorker:
    def __init__(self, results: list[bool | BaseException]) -> None:
        self._results = list(results)
        self.calls = 0

    def run_once(self, db: object) -> bool:
        self.calls += 1
        if not self._results:
            return False
        result = self._results.pop(0)
        if isinstance(result, BaseException):
            raise result
        return result


def test_run_once_pass_returns_true_when_prep_claims() -> None:
    prep = _FakeWorker([True])
    index = _FakeWorker([False])
    delete = _FakeWorker([False])
    db = object()

    assert run_once_pass(prep, index, delete, db) is True
    assert prep.calls == 1
    assert index.calls == 0
    assert delete.calls == 0


def test_run_once_pass_round_robins_until_claim() -> None:
    prep = _FakeWorker([False])
    index = _FakeWorker([True])
    delete = _FakeWorker([False])
    db = object()

    assert run_once_pass(prep, index, delete, db) is True
    assert prep.calls == 1
    assert index.calls == 1
    assert delete.calls == 0


def test_run_loop_busy_pass_skips_idle_sleep() -> None:
    prep = _FakeWorker([True, False])
    index = _FakeWorker([False, False])
    delete = _FakeWorker([False, False])
    sleeps: list[float] = []
    iterations = {"n": 0}

    def session_factory() -> object:
        return object()

    def should_continue() -> bool:
        iterations["n"] += 1
        return iterations["n"] <= 2

    run_loop(
        session_factory=session_factory,
        prep_worker=prep,
        index_worker=index,
        delete_worker=delete,
        idle_seconds=1.5,
        sleep_fn=sleeps.append,
        should_continue=should_continue,
    )

    assert sleeps == [1.5]
    assert prep.calls == 2


def test_run_loop_idle_pass_sleeps_once() -> None:
    prep = _FakeWorker([False])
    index = _FakeWorker([False])
    delete = _FakeWorker([False])
    sleeps: list[float] = []
    iterations = {"n": 0}

    def should_continue() -> bool:
        iterations["n"] += 1
        return iterations["n"] <= 1

    run_loop(
        session_factory=lambda: object(),
        prep_worker=prep,
        index_worker=index,
        delete_worker=delete,
        idle_seconds=2.0,
        sleep_fn=sleeps.append,
        should_continue=should_continue,
    )

    assert sleeps == [2.0]
    assert prep.calls == 1
    assert index.calls == 1
    assert delete.calls == 1


def test_touch_worker_heartbeat_creates_parent_and_file(tmp_path) -> None:
    heartbeat = tmp_path / "runtime-root" / WORKER_HEARTBEAT_FILENAME

    touch_worker_heartbeat(heartbeat)

    assert heartbeat.is_file()


def test_run_loop_touches_heartbeat_before_idle_sleep(tmp_path) -> None:
    prep = _FakeWorker([False])
    index = _FakeWorker([False])
    delete = _FakeWorker([False])
    heartbeat = tmp_path / WORKER_HEARTBEAT_FILENAME
    iterations = {"n": 0}
    sleeps: list[float] = []

    def should_continue() -> bool:
        iterations["n"] += 1
        return iterations["n"] <= 1

    def sleep_fn(seconds: float) -> None:
        assert heartbeat.is_file()
        sleeps.append(seconds)

    run_loop(
        session_factory=lambda: object(),
        prep_worker=prep,
        index_worker=index,
        delete_worker=delete,
        idle_seconds=2.0,
        sleep_fn=sleep_fn,
        should_continue=should_continue,
        heartbeat_path=heartbeat,
    )

    assert sleeps == [2.0]


def test_run_loop_continues_after_run_once_error(caplog: pytest.LogCaptureFixture) -> None:
    prep = _FakeWorker([RuntimeError("boom"), False])
    index = _FakeWorker([False, False])
    delete = _FakeWorker([False, False])
    sleeps: list[float] = []
    iterations = {"n": 0}
    closed: list[object] = []

    class _Session:
        def close(self) -> None:
            closed.append(self)

    def should_continue() -> bool:
        iterations["n"] += 1
        return iterations["n"] <= 2

    with caplog.at_level("INFO"):
        run_loop(
            session_factory=_Session,
            prep_worker=prep,
            index_worker=index,
            delete_worker=delete,
            idle_seconds=0.1,
            sleep_fn=sleeps.append,
            should_continue=should_continue,
        )

    assert len(closed) == 2
    assert sleeps == [0.1, 0.1]
    assert any(
        getattr(record, "event", None) == "stack_worker.iteration_failed"
        and getattr(record, "safe_error_code", None) == "worker_error"
        and getattr(record, "outcome", None) == "failed"
        for record in caplog.records
    )


def test_run_loop_continues_after_heartbeat_error(tmp_path, caplog: pytest.LogCaptureFixture) -> None:
    prep = _FakeWorker([False, False])
    index = _FakeWorker([False, False])
    delete = _FakeWorker([False, False])
    blocked_parent = tmp_path / "not-a-directory"
    blocked_parent.write_text("occupied", encoding="utf-8")
    heartbeat = blocked_parent / WORKER_HEARTBEAT_FILENAME
    sleeps: list[float] = []
    iterations = {"n": 0}

    def should_continue() -> bool:
        iterations["n"] += 1
        return iterations["n"] <= 2

    with caplog.at_level("INFO"):
        run_loop(
            session_factory=lambda: object(),
            prep_worker=prep,
            index_worker=index,
            delete_worker=delete,
            idle_seconds=0.1,
            sleep_fn=sleeps.append,
            should_continue=should_continue,
            heartbeat_path=heartbeat,
        )

    assert sleeps == [0.1, 0.1]
    assert prep.calls == 2
    assert any(
        getattr(record, "event", None) == "stack_worker.heartbeat_failed"
        and getattr(record, "safe_error_code", None) == "heartbeat_write_failed"
        and getattr(record, "outcome", None) == "failed"
        for record in caplog.records
    )


def test_build_workers_with_testing_settings_avoids_job_platforms() -> None:
    settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        admin_username="admin@example.test",
        admin_password="correct horse battery staple",
        session_cookie_secure=False,
        domain_runtime_controller_kind="local",
        lightrag_client_kind="local",
        source_storage_root="/tmp/ce-source-storage-test",
        domain_runtime_root="/tmp/ce-domain-runtimes-test",
        testing=True,
    )
    workers = build_workers(settings)
    assert set(workers.keys()) == {"prep", "index", "delete"}
    import sys

    forbidden = {"redis", "rq", "celery"}
    loaded = {name.split(".", 1)[0] for name in sys.modules}
    assert forbidden.isdisjoint(loaded)
