# Known Residuals — feat/runnable-stack-workers

Source: ce-work Phase 3 code review (2026-07-10), after P2 busy-loop fix landed in `83f6062f`.

## Applied

- P2 worker error path busy-loop → fixed (idle sleep on exception).

## Accepted residuals (testing gaps / residual risks)

1. No automated AST/import guard that `scripts/stack_smoke.py` never calls `run_once` / worker classes (manual + review confirmed HTTP-only).
2. Plan negative path (worker stopped/absent → prepare/index poll timeout) not covered by automated tests; full happy-path Docker smoke passed.
3. Safety scan allows any top-level `worker:` service; does not pin command to `python -m context_engine.worker`.
4. Worker liveness in smoke is Docker `Status==running` only (no healthcheck/heartbeat).
5. Stack acceptance uses local domain-runtime/LightRAG client kinds; live Docker LightRAG remains deferred (plan scope).
