---
id: F-009
title: Frontend Delivery Acceptance Evidence
status: in_progress
owner: Context Engine delivery team
last_reviewed: 2026-07-08
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Acceptance Evidence

Status: LS shell adoption implemented (navigation-sidebar, chat-shell, settings-panel, logs-observability, documents, graph shell). Remaining gates: preview blob, graph DTOs, Playwright/screenshot evidence.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `frontend/tests/foundation.test.mjs`; `npm run test` | pass | no browser token storage strings or sessionStorage use in frontend code |
| AC-002 | `frontend/src/lib/api/client.ts`; `frontend/src/state/auth-store.ts`; `npm run typecheck` | pass | shared client requests include credentials and auth store clears state on 401; live backend browser flow pending |
| AC-003 | `frontend/src/app/forbidden/page.tsx`; `frontend/src/lib/api/errors.ts`; `npm run test` | pass | safe 403 route/state exists; live browser redirect-loop proof pending |
| AC-004 | `frontend/src/features/settings-panel/SettingsPanel.tsx`; `frontend/src/features/navigation-sidebar/constants.ts` | partial | admin sections and `/logs` are role-gated in UI (backend remains authority); member/admin network-authz browser proof pending |
| AC-005 | `frontend/src/features/chat-shell/use-chat-shell.ts`; `frontend/tests/chat.test.mjs` | partial | EVT-001 stage/token/evidence/done/error translation implemented and statically tested; evidence now feeds the turn-scoped Evidence Panel (auto-open on `evidence` event, before answer completion); raw transcript fixture replay still pending |
| AC-006 | `frontend/src/lib/api/errors.ts`; `frontend/src/lib/api/client.ts`; `frontend/tests/foundation.test.mjs` | pass | client error surface is limited to safe fields and API client blocks non-CE URLs |
| AC-007 | pending Playwright coverage | planned | desktop/mobile key flows wait for live backend fixture coverage |
| AC-008 | `npm run build` | partial | production build passes; screenshot matrix at 1440x900, 1280x800, and narrow viewport remains pending |
| AC-009 | `frontend/src/features/navigation-sidebar/constants.ts`; `frontend/tests/foundation.test.mjs` | pass | LS sidebar order Chat -> Library -> Graph -> Logs (admin) -> Settings -> Logout; F-010 surfaces unregistered |
| AC-010 | `frontend/src/features/chat-shell/ChatShell.tsx`; `frontend/src/features/chat-shell/EvidencePanel.tsx`; `frontend/tests/chat.test.mjs` | partial | Evidence renders in the turn-scoped Evidence Panel (LS ComputerPanel-style aside; select assistant turn to bind; no second fetch path; no private ids — statically tested); accepted refs from CE SSE/history only; live stream browser proof pending |
| AC-011 | `frontend/src/features/chat-shell/ChatShell.tsx`; `frontend/src/features/chat-shell/EvidencePanel.tsx` | partial | direct turns emit no evidence event, so the Evidence Panel stays closed/empty for them and no route/model/tool controls exist; live browser proof pending |
| AC-012 | `frontend/tests/chat.test.mjs` (`does not port uncontracted Local Studio agent controls`) | pass | no terminal, filesystem, Git, browser automation, Pi runtime, model-controller, or cwd controls in chat-shell |
| AC-013 | `frontend/src/features/settings-panel/SettingsPanel.tsx`; `frontend/src/features/user-preferences/PreferencesPanel.tsx`; `frontend/src/lib/storage.ts` | pass | personal vs admin ownership split; credentials write-only; storage allowlist excludes raw controller URLs/API keys, host paths, runtime ports, and secrets |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
