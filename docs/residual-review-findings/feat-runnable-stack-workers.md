# Known Residuals — feat/runnable-stack-workers

Source: ce-work Phase 3 code review (2026-07-10), after P2 busy-loop fix landed in `83f6062f`, then stack follow-ups U1–U6.

## Applied

- P2 worker error path busy-loop → fixed (idle sleep on exception).
- Slice 1 residuals #1–#4 → closed (AST guard, dual negative proofs, safety-scan worker pin, heartbeat healthcheck).
- Slice 2 residual #5 → closed (optional live overlay; default gate remains local-fake).
- Follow-up review P1 → Postgres preserve recipe rewritten (temp Postgres + `pg_dump` / restore).
- Follow-up review P2 → live overlay safety scan allows `docker.sock` only under `api` / `worker`.

## Accepted residuals (testing gaps / residual risks)

1. Live smoke / live evidence remain operator/manual (or opt-in); CI records helpers + compose config + `stack_safety_scan.py --live-overlay`, not a PR-blocking live smoke.
2. Mid-pilot Docker negative proof remains behind `CE_RUN_STACK_NEGATIVE_MID_PILOT=1` so default `pytest -m integration_docker` stays bounded.
3. Worker heartbeat is touched after each `run_once` pass; a single long native index may briefly look unhealthy until the pass returns (healthcheck `start_period` / freshness window mitigate first boot, not arbitrarily long work units).
4. Live overlay mounts Docker socket into api/worker as a documented local single-operator ARCH-002 exception — not for production or shared multi-tenant use.
