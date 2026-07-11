---
id: F-012-TASKS
title: Governed Context Assembly Tasks
status: completed
owner: Context Engine delivery team
last_reviewed: 2026-07-08
depends_on: [F-012]
supersedes: []
---

# F-012 - Tasks

- [x] T-000 [docs] Read AGENTS.md, governance, CONTEXT.md, DESIGN.md, F-007, F-009, F-011, API-001, AI-001, DATA-001, EVT-001, architecture, quality specs, implementation, and tests.
- [x] T-010 [docs] Create F-012 feature docs and patch affected contracts/specs.
- [x] T-020 [data] Add F-012 migration/models for templates, ref tokens, accepted refs, and turn fingerprint.
- [x] T-030 [backend] Add prompt-template catalog and composer ref discovery/validation services.
- [x] T-040 [backend] Add `PromptAssemblyService` and integrate with P7 turn start, idempotency, and synthesis.
- [x] T-050 [backend] Project safe `acceptedRefs` through history, terminal/replay SSE, logs/traces/audit, and redaction.
- [x] T-060 [frontend] Add typed chat API seam, CE event reducer, and hook state.
- [x] T-070 [frontend] Implement three-region `/chat` workbench with Local Studio visual parity.
- [x] T-080 [verify] Run backend/frontend/migration/OpenAPI/safety/visual checks and update acceptance, implementation log, and traceability.
