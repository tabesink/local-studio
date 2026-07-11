---
id: F-006-TASKS
title: Server-Owned Conversation History tasks
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-004, F-005]
supersedes: []
---
# Ordered tasks

- [ ] 1. Add API list/detail/mutation functions under `features/conversations`.
- [ ] 2. Render summaries separate from detailed turns to bound list payloads.
- [ ] 3. On switching domain for a new turn, do not alter old turn domains.
- [ ] 4. Use server state after mutations; optimistic deletion is optional and must restore on failure.
- [ ] 5. Render redacted turns per data contract.
- [ ] Add/update the tests named in `test-plan.md`.
- [ ] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
- [ ] Record a deviation or open decision instead of improvising.
