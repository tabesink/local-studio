---
id: F-009-MAP
title: Frontend Vertical Slice Map
status: approved
owner: Context Engine frontend team
last_reviewed: 2026-06-30
depends_on: [F-009]
supersedes: []
---

# Frontend Vertical Slice Map

Build the frontend in this order. Each slice consumes backend contracts only after the named backend gate exists or fixtures are captured.

| Slice | User outcome | Backend gate | Layout/visual notes |
| --- | --- | --- | --- |
| 01 Runtime foundation | app boots with typed config/API/error surface | P1 error/config contract | install Local Studio-compatible tokens before feature screens |
| 02 Login cookie session | user signs in/out; protected routes resolve safely | P1 auth/session/logout | compact login, no browser token storage |
| 03 App shell/nav/settings entry | authenticated shell, role nav, empty Settings dialog | P1 current user + role | old CE shell shape; Local Studio compact rail/settings dialog |
| 04 Settings general | user edits general UI preferences | P1 session + UI state | dense form rows, no broad custom chrome |
| 05 Settings users | admin manages users | P1/P8 admin proof or user admin API | table/form in settings panel, member hidden + 403 safe state |
| 06 Settings domains | admin sees/configures domain surface | P3 APIs | domain status rows, no runtime URLs |
| 07 Settings model provider | admin manages model profiles without secret leak | P2 APIs | secret status only, compact provider rows |
| 08 Settings document parser | admin manages parser choice/status | P2/P4 APIs | parser kind/status rows, no secret values |
| 09 Documents library | user browses document status | P4/P5 source list/index state | dense list/table plus right detail panel |
| 10 Document upload operations | admin uploads/tracks async processing | P4 upload/prep + P5 index | upload dialog, operation progress, separate doc/index state |
| 11 Chat route shell | user composes a domain-scoped question | P3 domains + P6/P7 capability | conversation region, domain selector, anchored composer |
| 12 Chat SSE evidence | user sees streamed answer/evidence/failure handling | P7 SSE + P6 evidence DTO | evidence before tokens, cancel, stable frame |
| 13 Knowledge graph workspace | user inspects graph workspace | graph proxy contract after P6/P7 | graph canvas with right detail inspector; defer unknown API |
| 14 LightRAG domain lifecycle | admin runs domain lifecycle | P3 APIs | destructive confirmation, status/progress rows |
| 15 Operations recovery | admin tracks/retries/cancels operations | P3/P4/P5 operations | dense operations table/detail panel |
| 16 Workspace context/source nav | user navigates evidence/source context | later opaque source-ref contract | do not use private source/block IDs before contract |
| 17 Audit diagnostics | admin investigates safe diagnostics | P8 audit/diagnostics | safe metadata logs, bounded diagnostics, no raw paths/payloads |

## Shared Frontend Gates

- No route, component, hook, or test stores auth tokens in browser storage.
- Shared UI primitives never call API.
- Feature modules own endpoint wrappers and DTO mapping.
- Unknown API field shape creates a fixture capture task.
- Playwright covers desktop and narrow viewport for each route group.
- Visual checks compare dark and light Local Studio parity at `1440x900` and `1280x800` plus narrow viewport.
