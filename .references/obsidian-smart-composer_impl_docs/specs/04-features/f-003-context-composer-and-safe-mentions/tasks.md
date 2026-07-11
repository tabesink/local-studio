---
id: F-003-TASKS
title: Context Composer and Safe Mentions tasks
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-002]
supersedes: []
---
# Ordered tasks

- [ ] 1. Define target `ContextReference` separately from source `Mentionable` types.
- [ ] 2. Implement debounced source search with cancellation.
- [ ] 3. Render opaque IDs only in client state; fetch bounded labels/excerpts through API.
- [ ] 4. Serialize references in request body; never concatenate retrieved text into the prompt in Next.js.
- [ ] 5. Support keyboard token removal and clear aria labels.
- [ ] Add/update the tests named in `test-plan.md`.
- [ ] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
- [ ] Record a deviation or open decision instead of improvising.
