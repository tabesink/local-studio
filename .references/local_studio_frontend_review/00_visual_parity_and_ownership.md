# 00 — Visual Parity + Ownership Contract

## Visual source of truth

Local Studio source:

```text
frontend/src/app/styles/globals/tokens.css
frontend/src/lib/themes.ts
frontend/src/ui/
frontend/src/features/shell/
frontend/src/features/agent/
frontend/src/features/settings/
```

Context Engine product source:

```text
client/src/app/
client/src/components/
client/src/features/graph/
client/src/stores/
app/api/routes/
app/schemas/
```

## Reuse order

```text
1. Existing Local Studio token.
2. Existing Local Studio primitive.
3. Existing Local Studio layout/pattern.
4. Narrow Context Engine variant.
5. New component. Last option.
```

## Shared primitive map

| Need | Local Studio reference | Context Engine use |
|---|---|---|
| Rail/layout | `features/shell/` | App shell. Domain nav. Admin nav. |
| Page shell | `ui/page.tsx`, `ui/page-state.tsx` | All route shells. Loading/empty/forbidden. |
| Action | `ui/button.tsx` | Create, upload, run, stop, delete. |
| Form | `ui/input.tsx`, `select.tsx`, `form-field.tsx` | Login, settings, filters. |
| List/table | `ui/list.tsx`, `table.tsx` | Domains, docs, jobs, users, ops. |
| Detail | `ui/right-detail-panel.tsx` | Evidence, document, graph node, log. |
| Status | `ui/status.tsx`, `progress-bar.tsx` | Lifecycle, job, provider, stream state. |
| Focused task | `ui/modal.tsx`, `drawer.tsx` | Confirm delete, upload, config. |
| Error | `ui/error-box.tsx`, `alert.tsx` | API/stream/form errors. |

## State ownership

| State | Owner | Rule |
|---|---|---|
| User role | FastAPI | Client reads. Never decides permission alone. |
| Domain lifecycle | FastAPI/deploy service | Client refreshes server result. |
| Document/job status | FastAPI/worker | Client polls or receives supported update. |
| Evidence/citation | Retrieval/synthesis service | Client renders IDs/data received. |
| Composer draft | Current chat component | Clear after server accepts turn. |
| Active stream | Current chat component | `AbortController`; no global session store. |
| Rail/theme | Browser preference store | Non-secret only. |
| Detail panel selection | Route/feature local state | URL only when deep-link value exists. |

## Current vs future

| Capability | Current Context Engine | Future-only compatibility | Build now? |
|---|---|---|---:|
| RAG chat turn | Yes | Stable `turn_id` | Yes |
| Evidence inspector | Yes | Can later show artifact/tool output separately | Yes |
| Agent run | No | Separate future model | No |
| Terminal | No | Separate high-risk runtime | No |
| Filesystem | No | Future artifact store, not Document reuse | No |
| Durable conversation | No | Future Session/Turn models | No |

## Definition of done for every slice

```text
API contract named.
Role rule named.
Loading/empty/error/forbidden state named.
Local Studio visual transfer named.
No future-only capability accidentally created.
API + UI acceptance tests named.
```
