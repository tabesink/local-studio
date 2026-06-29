# Contradictions and Reconciliation Decisions

## Source-navigation timing

### Facts

- **[OBSERVED] P6:** safe evidence cards only; no source navigation, source refs, assets, document browser, original download, source IDs, block IDs, paths, or raw retrieval payload in browser response.
- **[OBSERVED] Frontend F16:** proposes source navigation panel/detail.
- **[OBSERVED] Old CE:** has source inspector / context-navigation concepts.

### Decision

```text
Now: metadata-only evidence inspector.
Later: authorized source navigation only after explicit backend contract.
Never: client-side source path or ID reconstruction.
```

### Build-now seam

```ts
type EvidenceViewModel = {
  responseEvidenceId: string; // response-local only
  excerpt: string;
  sourceLabel: string;
  detailCapability: 'metadata_only';
};
```

`EvidencePanel` can support local selection, keyboard movement, and a calm right-side presentation. It must not render an “Open source” control or issue a source-detail request.

### Later contract required

**CONTRACT CAPTURE REQUIRED** before navigation:

```text
authorization rule
opaque source-view handle, not a storage/path identifier
safe source detail window/excerpt model
asset authorization and expiry semantics
source/domain delete and chat-redaction behavior
audit requirement for source viewing
OpenAPI + runtime fixture + response-shape test
```

## Chat and SSE

### Competing assumptions

| Source | Endpoint / events |
|---|---|
| Frontend Slice 12 | `POST /chat/turn/stream`; `sources`, `answer_complete`, `evidence_only`, `error` |
| Old CE v1 | LightRAG-oriented shell/event behavior similar to legacy sources/completion path |
| P7 greenfield | `POST /api/v1/conversations/{conversation_id}/turns`; `evidence`, `token`, `done`, `error` |

### Decision

P7 is current greenfield authority, but exact emitted payloads/order are not yet proven. Do not write a parser against any legacy variant first.

```text
CONTRACT CAPTURE REQUIRED:
  pinned P7 SSE fixture
  event ordering
  terminal result-kind shape
  split-frame parsing
  duplicate client request behavior
  disconnect/cancel settlement
```

Target state machine:

```text
idle
-> submitting
-> evidence_ready
-> receiving_answer
-> terminal:
   grounded_answer | evidence_only | no_grounded_context | failed | redacted | locally_cancelled
```

Rules:

```text
Context Engine events only.
No raw provider events.
No raw LightRAG events.
No fabricated percent/progress/reconnect.
Evidence is API-mapped before display.
Generated text is not evidence.
No general-chat fallback.
```

## Settings information architecture

### Target layout

```text
Settings
  General                       all authenticated users
  Users                         admin only; read-only until user-write contract exists
  Domains                       admin only
  Provider and model settings   admin only
  Document parser               admin only
```

### Decision

Use a route-addressable dialog/sheet coordinator:

```text
Desktop: centered settings dialog with left navigation and right content.
Small screens: full-height sheet/page fallback.
State: local UI state first; URL section synchronization only after route policy is agreed.
```

Retain old CE’s focus-trap, Escape/overlay close, and focus restore. Use Local Studio dark-first density and section styling. Do not copy old CE’s incomplete admin-nav filtering: all admin sections must hide for members.

### Settings contract changes

| Legacy frontend assumption | Greenfield decision |
|---|---|
| `ai-settings`, provider secrets, arbitrary profile extras | P2 `runtime-settings`, known providers, safe configured status only |
| base URL editable | prohibited except infrastructure-owned endpoint, never browser editable |
| provider test/validate button | P2 has no provider network calls |
| parser profile list/test | P2 one active parser kind; no provider call/test in P2 |
| user CRUD available | only P1 read proof; write contract deferred |

## Operations model

### Backend ownership is resource-specific

```text
domain lifecycle               -> domain_operations
source preparation             -> source_preparation_operations
source indexing eligibility    -> source_documents.index_state
chat turns                     -> conversation_turns
audit                          -> audit_events
```

### Decision

A unified **Admin Activity** screen may exist as a frontend composition, not as a generic backend operations/workflow system.

```text
Activity UI
  Domains tab   -> domain lifecycle history adapter
  Sources tab   -> source prep / current index adapter
  Audit tab     -> audit adapter
  Chat support  -> only approved admin-safe read model, if ever added
```

Do not flatten distinct state machines into one fake universal status enum. Use per-resource status labels and detail mappers.

## Domain lifecycle

### P3 truth

```text
Domain state: stopped | running | deleting
Work: domain_operations
Health: derived observation
Availability: server-side derived rule
Actions: create | start | stop | delete
```

### Decision

- UI does not infer valid transitions.
- UI does not show repair, recreate, regenerate, purge, archive, restore, direct Docker, port, path, runtime URL, or controller data.
- Delete returns `202`; show deletion-in-progress until backend confirms row absence.
- Start/stop action pending state is operation-backed only.

## Documents versus sources

### Facts

- Frontend F09/F10 use generic “documents” and `/documents` / `/admin/documents/upload` assumptions.
- P4 owns **SourceDocument** and routes under a selected domain; member source viewing/download is explicitly deferred.

### Decision

Implement the admin page as **Sources Library** backed by P4/P5. “Documents” is an allowed navigation label only if product vocabulary deliberately wants it; it must never imply a member-facing generic repository or source-content browser.

## Knowledge graph workspace

LightRAG owns graph/vector retrieval internally, but no current greenfield graph proxy contract has been proven.

### Decision

```text
Now: dark workbench route shell, empty/loading/error state, accessible list-first fallback scaffold.
Later: renderer only after safe graph proxy contract.
Never: browser direct LightRAG graph call or graph mutation guessed from reference UI.
```

Required proof:

```text
domain-scoped endpoint
node/edge/detail DTO
limits/pagination
selection behavior
authorization
safe document/evidence link semantics
keyboard/list fallback parity
```

## Diagnostics and observability

P8 defines three separate layers:

```text
audit_events      security/admin accountability
structured stdout runtime/operator diagnostics
optional Langfuse metadata-only tracing
```

### Decision

Browser may show only safe audit events and a capped/redacted LightRAG diagnostics response when P8 enables it. It must not show raw logs, provider responses, LightRAG raw hits, prompts, secrets, cookies, runtime paths, container IDs, stack traces, Langfuse keys, or a Langfuse dashboard proxy.

## Dark-first UI reconciliation

### Conflict

Several earlier frontend slice docs describe white/light-neutral parity. User direction and Local Studio reference call for a compact dark-first workstation UI.

### Decision

```text
Visual base: Local Studio dark-first shell, typography, spacing, quiet status language.
Context Engine shape: old CE rail/settings/chat/domain/document concepts.
Behavior authority: greenfield backend only.
```

Do not turn Context Engine into Local Studio. No terminal, agent, model-runtime control, filesystem, session shell, recipes, or controller proxy.
