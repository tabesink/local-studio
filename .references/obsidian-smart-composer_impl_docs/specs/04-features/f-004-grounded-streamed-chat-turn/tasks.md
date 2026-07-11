---
id: F-004-TASKS
title: Grounded Streamed Chat Turn tasks
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-003]
supersedes: []
---
# Ordered tasks

- [ ] 1. Create `lib/api/stream.ts` with strict event parsing and unknown-event ignore/log policy.
- [ ] 2. Create a per-conversation reducer; do not store server state in a broad global store.
- [ ] 3. Generate one client idempotency UUID per submit attempt.
- [ ] 4. Use `AbortController` for browser cancellation; show stopped state only after typed outcome or local disconnected state.
- [ ] 5. Ensure a network failure keeps a retryable user draft without creating duplicate visible assistant turns.
- [ ] Add/update the tests named in `test-plan.md`.
- [ ] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
- [ ] Record a deviation or open decision instead of improvising.
