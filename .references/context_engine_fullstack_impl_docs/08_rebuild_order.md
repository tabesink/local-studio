# Ordered Rebuild Plan

| Order | Slice | Why first |
|---:|---|---|
| 01 | Runtime foundation | config, errors, tokens, test harness |
| 02 | Login + cookie session | secure entry boundary |
| 03 | App shell + nav + empty Settings | shared authenticated frame |
| 04–08 | Settings panels | isolated admin/user config slices |
| 09 | Document library | core read model |
| 10 | Upload + operation status | write + async workflow |
| 11 | Chat shell | static query UX |
| 12 | Chat SSE + evidence | highest integration risk |
| 13 | Graph workspace | consumes domain/evidence model |
| 14 | Domain lifecycle | destructive admin workflow |
| 15 | Operations recovery | async truth visibility |
| 16 | Workspace context/source nav | evidence depth |
| 17 | Audit/diagnostics | production support surface |

## Gate before next group

- 01–03: session, route guard, no browser credential persistence.
- 04–08: admin API contracts captured; no secret leakage.
- 09–10: document + operation state machine verified.
- 11–12: SSE capture tests prove event ordering/cancel/error.
- 13–17: admin control plane authorization + destructive paths tested.

## Explicit deferrals

Per-document ACL, multi-tenant sharing policy, offline cache/sync, generic workflow engine, plugin architecture, WebSocket migration, token-delta stream protocol, universal retry framework, broad state manager.
