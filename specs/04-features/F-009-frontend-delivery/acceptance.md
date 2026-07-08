---
id: F-009
title: Frontend Delivery Acceptance Evidence
status: in_progress
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Acceptance Evidence

Status: foundation implemented for T-000 through T-030 only. Later P9 slices remain gated by captured contracts and fixtures.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `frontend/tests/foundation.test.mjs`; `npm.cmd run test:foundation` | foundation pass | no browser token storage strings or sessionStorage use in frontend code |
| AC-002 | `frontend/src/lib/api/client.ts`; `frontend/src/state/auth-store.ts`; `npm.cmd run typecheck` | foundation pass | shared client requests include credentials and auth store clears state on 401; live backend browser flow pending |
| AC-003 | `frontend/src/app/forbidden/page.tsx`; `frontend/src/lib/api/errors.ts`; `npm.cmd run test:foundation` | foundation pass | safe 403 route/state exists; live browser redirect-loop proof pending |
| AC-004 | `frontend/src/components/settings/SettingsDialog.tsx`; `npm.cmd run test:foundation` | partial | admin panels remain unavailable in the shell; member/admin network-authz proof waits for panel fixtures |
| AC-005 | pending EVT-001 transcript fixtures | blocked | SSE ordering proof is gated before T-060 |
| AC-006 | `frontend/src/lib/api/errors.ts`; `frontend/src/lib/api/client.ts`; `frontend/tests/foundation.test.mjs` | foundation pass | client error surface is limited to safe fields and API client blocks non-CE URLs |
| AC-007 | pending Playwright coverage | planned | desktop/mobile key flows wait for live backend fixture coverage |
| AC-008 | `npm.cmd run build` | partial | production build passes; screenshot matrix at 1440x900, 1280x800, and narrow viewport remains pending |
| AC-009 | `frontend/src/components/layout/AppSideRail.tsx`; `frontend/tests/foundation.test.mjs` | foundation pass | shell routes and rail order match Chat -> Documents -> Knowledge graph -> Settings -> Logout |
| AC-010 | pending EVT-001 transcript fixtures and T-060 implementation | blocked | ContextPanelShell context tab is not implemented in foundation |
| AC-011 | pending T-060 implementation | blocked | direct LLM chat UI is not implemented in foundation |
| AC-012 | pending T-060 implementation | blocked | chat ergonomics remain blocked until streaming fixtures are captured |
| AC-013 | `frontend/src/components/settings/SettingsDialog.tsx`; `frontend/src/lib/storage.ts`; `frontend/tests/foundation.test.mjs` | foundation pass | Settings split exists and storage allowlist excludes raw controller URLs/API keys, host paths, runtime ports, and secrets |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
