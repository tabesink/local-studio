---
id: F-001-TASKS
title: Next.js Composition Root and Safe Session Bridge tasks
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-000]
supersedes: []
---
# Ordered tasks

- [ ] 1. Create `webui/src/app/(authenticated)/layout.tsx` as the browser composition root.
- [ ] 2. Add `lib/api/client.ts`, `errors.ts`, `contracts.ts`, and `auth/session.ts`.
- [ ] 3. Configure a same-origin API base; do not publish private backend URLs in browser configuration.
- [ ] 4. Resolve session once through the canonical client; do not mirror it into localStorage.
- [ ] 5. Add app-level error and not-found boundaries.
- [ ] Add/update the tests named in `test-plan.md`.
- [ ] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
- [ ] Record a deviation or open decision instead of improvising.
