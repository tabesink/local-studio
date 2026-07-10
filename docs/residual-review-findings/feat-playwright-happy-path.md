# Residual review findings — Playwright happy path (F-009)

Source: focused review of commit `0b5d8d61` + follow-up fix commit on `feat/runnable-stack-workers`.
Plan: `docs/plans/2026-07-10-002-feat-playwright-happy-path-plan.md`

## Applied in follow-up

- P1 stream-settled wait: wait on `data-testid="chat-streaming"` / `data-streaming` instead of composer-send enabled (send stays disabled when input empty).
- P1 timeouts: suite timeout raised to 300s; visual-matrix sets `test.setTimeout(300_000)`.
- P2 AC-010 honesty: domain RAG row assert now matches seed fixture safe labels (`e2e-pilot` / lockout / startup).

## Accepted residuals

- Failure screenshots under `frontend/test-results/` may briefly include UI state; keep gitignored and do not publish CI artifacts with secrets.
- Storage helper forbids forbidden key substrings only (per plan KTD-6), not values under allowlisted `ce.*` keys.
- Narrow chat matrix Evidence slide-over is proven by PNG review, not an automated locator assert.
- Playwright CI wiring remains deferred (plan follow-up).
