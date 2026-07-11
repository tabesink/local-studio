\
# 01 — Architecture Review
## Context Engine × Local Studio

## 1. Executive architecture decision

### Decision

Adopt Local Studio UI system. Do not adopt Local Studio product runtime.

| Decision | Adopt now | Preserve seam | Defer | Why |
|---|---:|---:|---:|---|
| Tokens, themes, typography | Yes | N/A | No | Direct UI parity. Current need. |
| Shell, sidebar, right panel | Yes | N/A | No | Current Context Engine routes need this. |
| Buttons, tables, status, forms | Yes | N/A | No | Shared UI need. |
| Query composer/thread feel | Yes | N/A | No | Current RAG query need. |
| FastAPI typed SSE query stream | Yes | Event parser accepts future event types safely | No | Current streaming need. |
| Agent runtime | No | Domain ID, turn ID, typed event envelope | Yes | No current multi-step tool requirement. |
| Terminal | No | None beyond future design note | Yes | High-risk. No product need. |
| Filesystem/workspace artifacts | No | Stable document/evidence IDs only | Yes | Documents != execution filesystem. |
| Durable sessions/history | No | Opaque `turn_id`; stable evidence IDs | Yes | No retention requirement. |
| Local Studio controller/Bun/Hono | No | None | No | Context Engine uses FastAPI. |
| Pi coding-agent runtime | No | None | No | Wrong product runtime. |
| Electron/desktop layer | No | None | No | No current product need. |

### Target architecture

```text
Browser
  -> Next.js client
     -> typed API modules
        -> FastAPI /api/v1
           -> domain services
              -> Postgres / Redis / workers / LightRAG / provider

Browser
  <- typed SSE chat events
     <- FastAPI stream generator
```

### Non-negotiable ownership

```text
FastAPI:
auth, role, domain access, lifecycle, document state, jobs,
retrieval, evidence, synthesis, providers, operations.

Frontend:
theme, sidebar collapsed state, selected domain UI state,
selected evidence, open detail panel, composer text,
active AbortController, current turn rendering.

Worker:
parse/index work only.

LightRAG/provider:
retrieval/index/generation capability. Never frontend source of truth.
```

---

## 2. Evidence and confidence limits

### Local Studio evidence

| Area | Reviewed path | Finding | Confidence |
|---|---|---|---|
| Global UI system | `frontend/src/app/styles/globals/tokens.css` | Dark/light tokens. 4px rhythm. 7px radius. 24/28px density. `--ui-*` aliases. | High |
| App shell | `frontend/src/features/shell/left-sidebar.tsx` | Dense collapsible workstation rail. | High |
| Shared primitives | `frontend/src/ui/` | Button/input/table/list/modal/drawer/status/page-state primitives. | High |
| Agent feature | `frontend/src/features/agent/` | Runtime, tools, workspace, sessions, filesystem, terminal-related concerns coupled here. | High |
| Settings | `frontend/src/features/settings/` | Compact settings composition. | High |
| Runtime boundary | `README.md`, `frontend/README.md` | Controller/Bun/Hono + frontend agent runtime. SSE-sensitive deployment. | High |

### Context Engine evidence

| Area | Reviewed path | Finding | Confidence |
|---|---|---|---|
| FastAPI app | `app/main.py` | Router composition. CORS. Existing route groups. | High |
| Auth client | `client/src/lib/api/client.ts` | Bearer token in `localStorage`. `credentials: "omit"`. Must change. | High |
| Retrieval client | `client/src/lib/lightrag-client.ts` | Calls JSON `POST /retrieve`. Function name says stream but response is not SSE. | High |
| Retrieval route | `app/api/routes/retrieve.py` | Authenticated non-streaming JSON retrieval route. | High |
| Chat state | `client/src/stores/chat-session-store.ts` | Client-generated `conversationId`. UI/session state mixed. | High |
| Documents/jobs | `app/api/routes/documents.py`, `app/api/routes/jobs.py`, schemas | Existing document/job concepts. | High |
| Graph | graph schemas/routes | Existing graph response/node/edge concepts. | High |
| Admin/provider | AI settings/admin route modules | Existing admin settings/provider behavior. | Medium-high |

### Limits

```text
No live Docker run.
No live provider stream.
No reverse-proxy test.
No rendered screenshot diff.
No worker cancellation test.
```

Do runtime verification in Phase 0. Do not assume source behavior equals production behavior.

---

## 3. Junior developer product map

### User flow

```text
1. User opens app.
2. Client calls GET /api/v1/session/me.
3. FastAPI reads secure session cookie.
4. FastAPI returns current user + role.
5. User selects domain.
6. Client opens domain query route.
7. User submits question.
8. Client POSTs one chat turn.
9. FastAPI checks user + domain access.
10. FastAPI retrieves evidence.
11. FastAPI emits evidence event.
12. FastAPI synthesizes answer.
13. FastAPI emits text deltas.
14. Client appends deltas.
15. User clicks citation.
16. Client opens evidence right panel.
17. Panel loads document/chunk detail if needed.
```

### Product objects

| Object | Plain meaning | Owner | Stored where | Read by | Written by |
|---|---|---|---|---|---|
| User | Signed-in person | Auth service | Postgres | client/FastAPI | admin/auth flow |
| Role | `admin` or `member` | Auth service | Postgres | FastAPI/client nav | admin/user flow |
| Domain | RAG workspace/access scope | Domain service | Postgres + runtime manifest | client/FastAPI | admin |
| Document | Uploaded source material | Document service | Postgres + object/filesystem managed storage | library/retrieval | admin upload |
| Ingestion job | Parse/index task | Job service/worker | Postgres/queue | admin UI | upload/retry flow |
| Evidence reference | Retrieval result pointer | Retrieval service | Generated per turn; source IDs durable | query UI | FastAPI retrieval |
| Citation | User-facing evidence reference | Synthesis/retrieval service | Generated per turn | query/detail UI | FastAPI |
| Graph node | Entity/relationship node | Graph service/LightRAG | graph store | graph UI | ingestion pipeline |
| Provider profile | Model/provider config | Provider service | secure config/DB | admin/settings | admin |
| Operation | Admin action record | Operation service | Postgres/log store | admin UI | FastAPI action |
| Chat turn | One question + one answer stream | Query service | Ephemeral now | query UI | FastAPI |
| Conversation session | Saved ordered turns | Future feature | Not stored now | none | none |
| Workspace artifact | Future generated file | Future feature | Not stored now | none | none |

### Object boundaries

```text
Document != artifact.
Document != host file.
Evidence != document copy.
Citation != source of truth.
Turn != session.
Session != agent run.
Domain != future execution workspace.
```

---

## 4. Local Studio -> Context Engine capability matrix

| Capability | Local Studio behavior | Context Engine current behavior | Decision | Exact impact |
|---|---|---|---|---|
| Shell/sidebar | Workstation rail, compact navigation | Existing app layout/sidebar | Controlled adaptation | Port visual primitives. Preserve Context routes. |
| Theme/tokens | `zai-dark`/`zai-light`, token aliases | Existing UI styling | Direct reuse | One Context token file. No duplicate token set. |
| Shared primitives | Dense controls/panels/tables | Existing UI components | Direct reuse | Port/adapt only needed primitives. |
| Settings | Compact settings surfaces | Provider/admin settings | Controlled adaptation | Keep FastAPI settings data. Replace chrome. |
| Chat composer | Agent-workspace composer | Query composer | Controlled adaptation | Rebuild UI. Keep RAG semantics. |
| Streaming | Agent/controller state stream | JSON retrieval response | Controlled adaptation | Add FastAPI typed SSE. |
| Detail panel | Inspector/context panel | Evidence/doc details fragmented | Direct reuse | One `RightDetailPanel`. |
| Auth | Local app/controller assumptions | Bearer localStorage token | Context Engine only | Cookie auth. No port. |
| Role gating | Not core Local Studio feature | Admin/member model | Context Engine only | Server 403. Client hides nav. |
| Agent runtime | Pi runtime/tool loop | None | Future seam only | No code now. |
| Tool execution | Agent tool registry | None | Future seam only | No code now. |
| Terminal | Local runtime terminal surface | None | Exclude now | No code/model/route/UI. |
| Filesystem | Local agent workspace/files | Documents/source paths | Exclude now | No host FS exposure. |
| Artifacts | Agent outputs possible | None | Future seam only | New model later. |
| Durable session | Agent session/replay | Client pseudo conversation ID | Future seam only | Remove durable implication now. |
| Session replay | Agent runtime replay | None | Exclude now | No code. |
| Queue/progress | Agent tasks/status | Ingestion jobs | Controlled adaptation | Reuse status UI only. |
| Logs | Runtime logs | Jobs/operations logs | Controlled adaptation | FastAPI remains owner. |
| Document library | Not core RAG library | Existing | Context Engine only | Preserve/restyle. |
| Graph | Not equivalent | Existing | Context Engine only | Preserve/restyle. |
| Provider config | Controller settings | Existing AI settings | Controlled adaptation | FastAPI provider API. |
| Desktop/Electron | Desktop host | Browser app | Exclude | No code. |

---

## 5. Current vs future capability boundary

### Build now

```text
cookie auth
role contract
Local Studio tokens/primitives/shell
single typed FastAPI API client
single typed SSE parser
single RAG chat turn stream
evidence right panel
domain/document/job/graph/provider/admin surfaces
```

### Preserve now

```text
opaque turn_id
stable document_id/chunk_id/evidence reference IDs
domain-scoped authorization
typed stream event envelope
feature-scoped API modules
one route group per real product capability
operation/log records where current admin work needs them
```

### Defer

```text
AgentRun
ToolRun
TerminalRun
WorkspaceArtifact
ConversationSession
ConversationTurn
workspace execution runtime
tool registry
filesystem browser
terminal component
WebSocket transport
generic plugin/capability framework
```

### Rule

Future feature starts only after real trigger:

```text
Approved product requirement
+ named user workflow
+ owner
+ security/data retention decision
+ API contract
+ data model
+ tests
```

No trigger -> no code.

---

## 6. Future compatibility: agent runtime

### What Local Studio agent runtime is

Agent runtime = loop.

```text
user task
-> model plans
-> model calls tool
-> tool changes/reads environment
-> model observes result
-> next step
-> final result
```

This needs runtime state, tool policy, audit, cancellation, budgets, retry, environment ownership.

Context Engine query now:

```text
question
-> retrieve evidence
-> synthesize grounded answer
-> stream answer
-> done
```

Different product.

### Current rule

Do not hard-code query UI as only possible future message shape. But do not build agent framework.

Allowed seam:

```text
Chat turn has opaque turn_id.
SSE uses typed named events.
Domain ID scopes current RAG access.
SSE parser ignores unknown future events safely.
```

Not allowed now:

```text
AgentRun table
agent route
feature/agent
ToolCall type
ToolRegistry interface
generic command executor
agent navigation
agent session store
agent trace panel
```

### Future trigger

Add agent runtime only when product requires one named workflow needing multi-step actions.

Examples:

```text
"Compare two selected documents then create approved summary artifact."
"Run approved analysis skill against selected domain data."
```

Not enough:

```text
"Maybe agents later."
"Local Studio has it."
```

### Future design, not current code

```text
POST /api/v1/domains/{domain_id}/agent-runs
GET  /api/v1/agent-runs/{agent_run_id}
GET  /api/v1/agent-runs/{agent_run_id}/events
```

Future model:

```text
AgentRun
- id
- domain_id
- requested_by_user_id
- status
- goal
- started_at
- completed_at
- failure_code
```

Before adding:

```text
Tool inventory.
Tool allowlist.
Per-tool authorization.
Run timeout.
Cost budget.
Cancellation.
Audit retention.
Isolation decision.
Security review.
```

---

## 7. Future compatibility: terminal

Terminal = server-side process execution.

High risk.

### Current rule

```text
No terminal route.
No TerminalRun table.
No WebSocket.
No xterm UI.
No shell command input.
No fake terminal output card.
No subprocess.run(user_input).
```

### Why

Terminal requires all:

```text
isolated runtime
command allowlist
network policy
filesystem policy
CPU/memory/time limits
output size limit
secret redaction
per-run authorization
audit log
cancel
cleanup
```

FastAPI route alone is not safe execution design.

### Future trigger

Only after product requirement needs controlled execution.

Example:

```text
Admin starts approved deterministic document conversion/analysis command.
```

### Future API example only

```text
POST /api/v1/workspaces/{workspace_id}/terminal-runs
GET  /api/v1/terminal-runs/{terminal_run_id}
GET  /api/v1/terminal-runs/{terminal_run_id}/events
POST /api/v1/terminal-runs/{terminal_run_id}/cancel
```

These endpoints do not exist now. Do not add them now.

---

## 8. Future compatibility: filesystem and artifacts

### Terms

```text
Document:
RAG source input. Parsed/indexed. Existing Context Engine object.

Artifact:
Future generated or modified output. Example CSV, markdown report, image.

Filesystem:
Execution environment storage. Never host filesystem exposure.
```

### Current rule

```text
Keep Document model for user source material.
Keep `source_path` as evidence metadata only.
Do not expose host paths as browseable filesystem.
Do not create workspace file browser.
Do not treat uploads as agent files.
Do not use Document table for future generated artifacts.
```

### Allowed seam

```text
Stable document_id.
Stable chunk_id.
Stable evidence reference ID.
Future artifact can link to source document/evidence.
```

### Future model only

```text
WorkspaceArtifact
- id
- workspace_id
- path
- media_type
- size_bytes
- created_at
- created_by_user_id
- source_run_id
```

Do not create table now.

### Future trigger

Agent/runtime creates durable user-visible output. Then decide:

```text
workspace lifetime
object storage vs mounted volume
read/write policy
artifact retention
export/delete
antivirus/content policy
access model
```

---

## 9. Future compatibility: sessions/history

### Distinguish

```text
Chat turn:
one request -> one stream. Current feature.

Conversation session:
persisted ordered turns. Future feature.

Agent session:
durable run state + tools + workspace + trace. Future feature.
```

### Current rule

```text
No persisted conversation.
No session ID.
No replay.
No chat history API.
No automatic transcript retention.
```

Current client `conversationId` is local UI state. It must not imply a backend persistence contract.

### Allowed seam

```text
turn_id is opaque.
Citation/evidence IDs stable.
Future ConversationTurn can reference historical turn_id only if retained later.
```

### Future model only

```text
ConversationSession
- id
- domain_id
- created_by_user_id
- title
- created_at
- updated_at

ConversationTurn
- id
- session_id
- ordinal
- question
- answer
- citations
- created_at
```

### Future trigger

Explicit requirement answers all:

```text
Why save history?
Who can read it?
How long retain it?
Can user delete/export it?
Can admin audit it?
Does it affect future retrieval?
How redact sensitive data?
```

No answers -> no persistence.
