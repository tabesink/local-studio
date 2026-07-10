---
id: F-009
title: Frontend Delivery Acceptance Evidence
status: in_progress
owner: Context Engine delivery team
last_reviewed: 2026-07-10
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Acceptance Evidence

Status: LS shell adoption implemented (navigation-sidebar, chat-shell, settings-panel, logs-observability, documents, graph shell). Playwright pilot happy-path + DESIGN screenshot matrix landed 2026-07-10. Remaining gates: preview blob, graph DTOs, remaining AC-007 (documents preview / graph browser), some live authz proofs.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `frontend/tests/foundation.test.mjs`; `npm test`; Playwright `tests/e2e/pilot-happy-path.spec.ts` storage assert (2026-07-10: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3010 npm run test:e2e` — 4 passed) | pass | static scan plus live browser: after login/logout, `localStorage`/`sessionStorage` have no token/bearer/password/session keys outside allowlisted `ce.*` UI prefs |
| AC-002 | `frontend/src/lib/api/client.ts`; `frontend/src/state/auth-store.ts`; `npm run typecheck`; Playwright login/logout against stack | pass | shared client requests include credentials; live cookie session proven via Playwright login → `/chat` → logout → `/login` |
| AC-003 | `frontend/src/app/forbidden/page.tsx`; `frontend/src/lib/api/errors.ts`; `npm run test` | pass | safe 403 route/state exists; live browser redirect-loop proof still pending |
| AC-004 | `frontend/src/features/settings-panel/SettingsPanel.tsx`; `frontend/src/features/navigation-sidebar/constants.ts` | partial | admin sections and `/logs` are role-gated in UI (backend remains authority); member/admin network-authz browser proof pending |
| AC-005 | `frontend/src/features/chat-shell/use-chat-shell.ts`; `frontend/tests/chat.test.mjs`; Playwright direct + domain turns | partial | EVT-001 stage/token/evidence/done/error translation implemented and statically tested; live stream browser proof via Playwright pilot path; raw transcript fixture replay still pending |
| AC-006 | `frontend/src/lib/api/errors.ts`; `frontend/src/lib/api/client.ts`; `frontend/tests/foundation.test.mjs` | pass | client error surface is limited to safe fields and API client blocks non-CE URLs |
| AC-007 | Playwright `tests/e2e/pilot-happy-path.spec.ts` (login, direct chat, domain RAG + Evidence, logout) against `compose.stack.yml` | partial | **pilot subset pass** 2026-07-10 (`npm run test:e2e`, 4 passed). Remaining AC-007: documents PDF preview and graph browser flows stay planned until preview/graph contracts exist |
| AC-008 | Playwright `tests/e2e/visual-matrix.spec.ts`; artifacts under `frontend/tests/e2e/artifacts/` (gitignored): `login-{1440x900-dark,1440x900-light,1280x800-dark,390x844-dark}.png`, `chat-{same}.png` | pass | DESIGN matrix captured 2026-07-10. Visual review: login empty form (dark/light); chat with Evidence Panel open on domain RAG (desktop); narrow viewport shows mobile app bar + evidence slide-over. No filled passwords in shots. Manual review only — no pixel-diff CI |
| AC-009 | `frontend/src/features/navigation-sidebar/constants.ts`; `frontend/tests/foundation.test.mjs` | pass | LS sidebar order Chat -> Library -> Graph -> Logs (admin) -> Settings -> Logout; F-010 surfaces unregistered |
| AC-010 | `frontend/src/features/chat-shell/ChatShell.tsx`; `frontend/src/features/chat-shell/EvidencePanel.tsx`; `frontend/tests/chat.test.mjs`; Playwright domain RAG test | pass | Evidence Panel live proof: domain turn opens complementary Evidence region with ≥1 safe row (`citationLabel`/`sourceLabel`/`excerpt`); no private ids asserted |
| AC-011 | `frontend/src/features/chat-shell/ChatShell.tsx`; Playwright direct-chat test | pass | direct turns leave Evidence Panel closed/empty in live browser; no route/model/tool controls |
| AC-012 | `frontend/tests/chat.test.mjs` (`does not port uncontracted Local Studio agent controls`) | pass | no terminal, filesystem, Git, browser automation, Pi runtime, model-controller, or cwd controls in chat-shell |
| AC-013 | `frontend/src/features/settings-panel/SettingsPanel.tsx`; `frontend/src/features/user-preferences/PreferencesPanel.tsx`; `frontend/src/lib/storage.ts` | pass | personal vs admin ownership split; credentials write-only; storage allowlist excludes raw controller URLs/API keys, host paths, runtime ports, and secrets |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
