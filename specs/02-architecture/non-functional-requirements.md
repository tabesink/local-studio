---
id: ARCH-005
title: Non-Functional Requirements
status: approved
owner: Context Engine architecture team
last_reviewed: 2026-06-30
depends_on: [GOV-001, PROD-001]
supersedes: []
---

# Non-Functional Requirements

| ID | Category | Requirement | Scope | Evidence |
| --- | --- | --- | --- | --- |
| NFR-001 | Security | cookie-only browser auth, backend authz on all protected routes | fullstack | P1/P9 tests |
| NFR-002 | Privacy | no secrets/raw source/prompt/provider/runtime payload in API/logs/traces | fullstack | snapshots, scans |
| NFR-003 | Reliability | destructive cleanup is fenced, resumable where specified, and tested | P3-P7 | integration tests |
| NFR-004 | Evidence quality | citations require exact eligible Source Block mapping | P5-P7 | fixture/mapper tests |
| NFR-005 | Performance | pilot target is 5-10 concurrent internal users only until benchmark evidence says otherwise | P8 | load test |
| NFR-006 | Accessibility | keyboard reachable shell, dialogs, tables, detail panels, composer, and controls | P9 | Playwright/manual a11y |
| NFR-007 | Operability | request IDs, safe logs, audit events, optional trace IDs for chat | P1-P8 | log/audit tests |
| NFR-008 | Visual quality | dark/light Local Studio visual parity at desktop and narrow viewports | P9 | screenshots/visual review |

## Explicit Scale Limit

Do not claim readiness for more than the internal 5-10 user pilot until P8 benchmark evidence exists for target hardware, data volume, provider quotas, and concurrent workflows.
