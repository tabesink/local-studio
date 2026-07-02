# System Wiring Map

## Product Shell (target)

**Structure:** port old CE client (`.references/code/context-engine/client/`).  
**Skin:** Local Studio tokens (`DESIGN.md`).

```text
┌────┬──────────────────────────────────────────────┬──────────────┐
│Rail│              Primary Canvas                  │ Context panel│
│w-14│  /chat | /documents | /database-visualize   │ (route-specific)
│icon│                                              │              │
│    │  Documents: list │ PDF preview (50% lg+)    │ Chat: SidePanel
│Chat│  Graph: sigma canvas + floating controls    │ Graph: Props │
│Docs│  Chat: thread + composer                   │              │
│Graph│                                             │              │
│Set*│                                             │              │
│Out │                                             │              │
└────┴──────────────────────────────────────────────┴──────────────┘
  * Settings = dialog overlay; Logout bottom of rail
  See 02-ce-client-port-map.md for exact CE file paths
```

## Layer Boundaries

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│  Next.js    │     │  FastAPI (CE)    │     │  Private infrastructure │
│  P9 UI      │────►│  P1–P8 contracts │────►│  Postgres, storage,     │
│  typed API  │ SSE │  auth, DTOs,     │     │  worker, controller,    │
│  wrappers   │     │  eligibility     │     │  LightRAG per domain    │
└─────────────┘     └──────────────────┘     └─────────────────────────┘
       │                     │
       │ never               │ never exposes
       ▼                     ▼
  localStorage           secrets, paths,
  (no tokens)            runtime URLs, raw hits
```

## Phase → API → UI Slice

| Phase | Feature | Primary API surface | Frontend slice(s) |
| --- | --- | --- | --- |
| P0 | F-000 | specs only | — |
| P1 | F-001 | `/auth/*`, `/health/*` | 01–03 |
| P2 | F-002 | `/admin/runtime-settings/*` | 07–08 |
| P3 | F-003 | `/admin/domains/*`, `GET /domains` | 06, 11, 14 |
| P4 | F-004 | `/admin/domains/{id}/sources/*` | 09–10, 15 |
| P5 | F-005 | index retry/cancel on sources | 10, 15 |
| P6 | F-006 | `POST /domains/{id}/evidence` | 12 (evidence panel) |
| P7 | F-007 | conversations + SSE turn | 11–12 |
| P8 | F-008 | `/admin/audit-events`, diagnostics | 17 |
| P9 | F-009 | consumes P1–P8 only | all 17 slices |

## Data Flow — Happy Path

```text
Admin: create domain (P3)
  → start runtime (P3 worker/controller)
  → upload source (P4)
  → worker prepares blocks (P4)
  → worker indexes to LightRAG (P5)
  → source query-eligible (P5 predicate)

Member: select domain (P3 list)
  → ask question (P7 SSE)
      → P6 evidence retrieval (server-side, before tokens)
      → synthesis stream (P7)
      → citations in answer (P7)
```

## State Ownership

| Concern | Owner | UI rule |
| --- | --- | --- |
| Auth session | Server (`ce_session` cookie) | Poll `/auth/me`; 401 → login once |
| Domain lifecycle | Server `domains.state` | Poll status endpoint; no client inference |
| Source prep/index | Server `source_documents.*` | Show DTO fields only |
| Query eligibility | Server `source_is_query_eligible()` | Never duplicate in frontend |
| Conversation turns | Server + SSE | Client request id for idempotency |
| Theme/rail width | Frontend local UI state | OK — not product truth |

## Error Envelope (all phases)

```json
{ "error": { "code": "...", "message": "...", "requestId": "...", "fields?": {} } }
```

UI: show safe `message` + mono `requestId`. Never log raw payloads.

## Spec Links

- API catalog: `specs/03-contracts/api/context-engine-v1.md`
- Data shapes: `specs/03-contracts/data/context-engine-data.md`
- SSE: `specs/03-contracts/sse/` (P7)
- Old CE layout/routes/PDF viewer: `.references/code/context-engine/client/` → see `02-ce-client-port-map.md`
- LS visual evidence: `.references/code/local-studio/frontend/src/`
