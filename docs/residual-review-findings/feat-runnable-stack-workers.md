# Known Residuals — feat/runnable-stack-workers

Source: ce-work Phase 3 code review (2026-07-10), after P2 busy-loop fix landed in `83f6062f`.

## Applied

- P2 worker error path busy-loop → fixed (idle sleep on exception).

## Accepted residuals (testing gaps / residual risks)

1. ~~No automated AST/import guard that `scripts/stack_smoke.py` never calls `run_once` / worker classes~~ — closed by Slice 1 (`tests/test_stack_smoke_imports.py`).
2. ~~Plan negative path (worker stopped/absent → prepare/index poll timeout) not covered by automated tests~~ — closed by Slice 1 (`tests/test_stack_smoke_worker_negative.py`; Docker cases skip without daemon/env).
3. ~~Safety scan allows any top-level `worker:` service; does not pin command to `python -m context_engine.worker`~~ — closed by Slice 1 (`scripts/stack_safety_scan.py` worker command pin).
4. ~~Worker liveness in smoke is Docker `Status==running` only (no healthcheck/heartbeat)~~ — closed by Slice 1 (heartbeat file + compose healthcheck + `worker_healthy` smoke gate).
5. ~~Stack acceptance uses local domain-runtime/LightRAG client kinds; live Docker LightRAG remains deferred~~ — closed by Slice 2 (`compose.stack.live.yml` + `scripts/stack_smoke_live.py`; default gate remains local-fake).
