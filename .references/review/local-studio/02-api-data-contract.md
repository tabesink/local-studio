\
# 02 — API and Data Contract
## FastAPI First. Typed. Lean.

## 10. Current target API contract

### Rules

```text
FastAPI OpenAPI = source of truth.
Generate TypeScript from OpenAPI.
Do not hand-copy Pydantic shapes into React.
All target browser endpoints start /api/v1.
One error shape.
One pagination shape.
One API module per feature.
```

### Authentication

Current client behavior:

```text
localStorage bearer token
credentials: omit
```

Target behavior:

```text
HttpOnly session cookie
Secure in production
SameSite=Lax minimum
same-origin /api reverse proxy preferred
credentials: include
no token in localStorage
no token in sessionStorage
no token in URL
```

### CSRF

Cookie auth changes threat model.

Use:

```text
HttpOnly session cookie
+ Origin/Referer validation for unsafe methods
+ CSRF token for unsafe browser methods
```

Minimal contract:

```http
GET /api/v1/session/csrf
```

Response sets readable same-site CSRF cookie or returns token. Client sends token in `X-CSRF-Token`. FastAPI validates token + Origin.

Do not skip CSRF because API is "internal".

### Endpoint inventory

| Endpoint | Method | Role | Request | Response | Frontend module | Backend owner |
|---|---|---|---|---|---|---|
| `/api/v1/session/login` | POST | Public | `LoginRequest` | `CurrentUser`; sets session cookie | `features/auth/api.ts` | auth |
| `/api/v1/session/logout` | POST | Signed-in | none | `204`; clears cookie | `features/auth/api.ts` | auth |
| `/api/v1/session/me` | GET | Signed-in | none | `CurrentUser` | `features/auth/api.ts` | auth |
| `/api/v1/session/csrf` | GET | Signed-in/public per chosen design | none | CSRF token/cookie | `lib/api/http.ts` | auth |
| `/api/v1/domains` | GET | Member/admin | cursor, limit | `Page[DomainSummary]` | `features/domains/api.ts` | domains |
| `/api/v1/domains/{domain_id}` | GET | Authorized | none | `DomainDetail` | `features/domains/api.ts` | domains |
| `/api/v1/admin/domains` | POST | Admin | `CreateDomainRequest` | `DomainDetail` | `features/domains/api.ts` | domains |
| `/api/v1/admin/domains/{domain_id}/start` | POST | Admin | none | `OperationSummary` | `features/domains/api.ts` | lifecycle |
| `/api/v1/admin/domains/{domain_id}/stop` | POST | Admin | none | `OperationSummary` | `features/domains/api.ts` | lifecycle |
| `/api/v1/admin/domains/{domain_id}` | DELETE | Admin | none | `OperationSummary` | `features/domains/api.ts` | lifecycle |
| `/api/v1/domains/{domain_id}/documents` | GET | Authorized | cursor, limit, status | `Page[DocumentSummary]` | `features/library/api.ts` | documents |
| `/api/v1/admin/domains/{domain_id}/documents` | POST | Admin | multipart file + parser | `UploadDocumentResponse` | `features/library/api.ts` | documents/jobs |
| `/api/v1/domains/{domain_id}/documents/{document_id}` | GET | Authorized | none | `DocumentDetail` | `features/library/api.ts` | documents |
| `/api/v1/domains/{domain_id}/documents/{document_id}` | DELETE | Admin | none | `OperationSummary` | `features/library/api.ts` | documents |
| `/api/v1/domains/{domain_id}/documents/{document_id}/chunks/{chunk_id}` | GET | Authorized | none | `EvidenceChunk` | `features/library/api.ts` | documents |
| `/api/v1/domains/{domain_id}/ingestion-jobs` | GET | Admin | cursor, limit, status | `Page[IngestionJobSummary]` | `features/ingestion/api.ts` | jobs |
| `/api/v1/ingestion-jobs/{job_id}` | GET | Admin | none | `IngestionJobDetail` | `features/ingestion/api.ts` | jobs |
| `/api/v1/ingestion-jobs/{job_id}/retry` | POST | Admin | none | `OperationSummary` | `features/ingestion/api.ts` | jobs |
| `/api/v1/domains/{domain_id}/chat/turns` | POST | Authorized | `ChatTurnRequest` | `text/event-stream` | `features/query/api.ts` | query/retrieval |
| `/api/v1/domains/{domain_id}/graph` | GET | Authorized | label/depth/limit | `GraphResponse` | `features/graph/api.ts` | graph |
| `/api/v1/domains/{domain_id}/graph/labels` | GET | Authorized | none | `list[GraphLabel]` | `features/graph/api.ts` | graph |
| `/api/v1/admin/providers` | GET | Admin | none | `ProviderConfig` | `features/providers/api.ts` | provider |
| `/api/v1/admin/providers` | PATCH | Admin | provider/profile patch | `ProviderConfig` | `features/providers/api.ts` | provider |
| `/api/v1/admin/providers/{provider_id}/test` | POST | Admin | none | `OperationSummary` | `features/providers/api.ts` | provider |
| `/api/v1/admin/operations` | GET | Admin | cursor, limit, type, status | `Page[OperationSummary]` | `features/operations/api.ts` | operations |
| `/api/v1/admin/operations/{operation_id}` | GET | Admin | none | `OperationDetail` | `features/operations/api.ts` | operations |

### Existing -> target migration

| Current shape | Problem | Target |
|---|---|---|
| `POST /retrieve` JSON | No provider delta stream. Client reconstructs answer from evidence. | `POST /api/v1/domains/{id}/chat/turns` SSE. |
| Client local bearer token | Credential in browser storage. | HttpOnly session cookie. |
| Unversioned route families | Contract drift risk. | `/api/v1` target API. |
| Offset job lists | Fine now; cursor target if list can grow. | One `Page[T]` shape. |
| Client `conversationId` | Looks durable. Is not. | Feature-local current-turn state. |
| Multiple UI styles | Parity drift. | Local Studio token/primitives base. |

### Error envelope

```json
{
  "error": {
    "code": "domain_not_ready",
    "message": "Selected domain is not ready.",
    "details": {},
    "request_id": "req_01..."
  }
}
```

Rules:

```text
code = stable machine name.
message = user-safe text.
details = optional structured safe data.
request_id = support/log correlation.
Never return secret/provider raw error by default.
```

### Pagination

```json
{
  "items": [],
  "page": {
    "limit": 50,
    "next_cursor": null
  }
}
```

Use cursor only if needed. Current offset can remain behind API mapper during migration. Do not expose two shapes to frontend.

---

## 11. Typed SSE query contract

### Why SSE

Current need = server -> browser incremental answer.

SSE fits.

```text
One request.
One direction.
One query turn.
No persistent socket.
No client-to-server live messages after request body.
```

Do not use WebSocket.

Do not use `EventSource`. `EventSource` cannot send required POST body.

### Request

```http
POST /api/v1/domains/{domain_id}/chat/turns
Content-Type: application/json
Accept: text/event-stream
Cookie: context_engine_session=...
X-CSRF-Token: ...
```

```json
{
  "question": "What are main safety requirements?",
  "mode": "hybrid",
  "top_k": 12
}
```

### Event envelope

```text
event: turn.started
data: {"type":"turn.started","turn_id":"turn_...","occurred_at":"2026-06-28T...Z"}
```

### Current events

| Event | Payload | Why now | UI behavior | Terminal |
|---|---|---|---|---:|
| `turn.started` | turn ID, timestamp | Tracks one real turn | Create assistant placeholder | No |
| `turn.status` | stage, message | Retrieval/synthesis state | Compact status row | No |
| `turn.evidence` | evidence references | Evidence supports answer | Populate right panel/citation map | No |
| `turn.delta` | sequence, text | Incremental answer | Append body text | No |
| `turn.completed` | citations, duration | Final answer metadata | Mark complete | Yes |
| `turn.failed` | code, message, retryable | Structured failure | Error row/retry button | Yes |

### Current event model

```python
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

class ChatTurnRequest(BaseModel):
    question: str = Field(min_length=1, max_length=20_000)
    mode: Literal["hybrid", "semantic", "navigation"] = "hybrid"
    top_k: int | None = Field(default=None, ge=1, le=30)

class ChatTurnStartedEvent(BaseModel):
    type: Literal["turn.started"] = "turn.started"
    turn_id: str
    occurred_at: datetime

class ChatTurnStatusEvent(BaseModel):
    type: Literal["turn.status"] = "turn.status"
    turn_id: str
    stage: Literal["retrieving", "synthesizing"]
    message: str | None = None

class ChatTurnEvidenceEvent(BaseModel):
    type: Literal["turn.evidence"] = "turn.evidence"
    turn_id: str
    evidence: list["EvidenceReference"]

class ChatTurnDeltaEvent(BaseModel):
    type: Literal["turn.delta"] = "turn.delta"
    turn_id: str
    sequence: int
    text: str

class ChatTurnCompletedEvent(BaseModel):
    type: Literal["turn.completed"] = "turn.completed"
    turn_id: str
    citations: list["Citation"]
    duration_ms: int

class ChatTurnFailedEvent(BaseModel):
    type: Literal["turn.failed"] = "turn.failed"
    turn_id: str | None = None
    code: str
    message: str
    retryable: bool
```

### Server flow

```text
Validate request
-> authenticate
-> authorize domain access
-> create in-memory turn state
-> emit turn.started
-> retrieve
-> emit turn.status(retrieving)
-> emit turn.evidence
-> synthesize
-> emit turn.status(synthesizing)
-> emit turn.delta x N
-> emit turn.completed
```

Failure:

```text
Known user-safe failure
-> emit turn.failed
-> stop stream
```

### Browser flow

```text
submit
-> new AbortController
-> fetch POST with credentials include
-> read response.body
-> parse SSE frames
-> validate event payload
-> update feature-local turn state
-> completed/failed clears active controller
```

### Stop

```text
User clicks stop
-> AbortController.abort()
-> browser closes request
-> FastAPI detects disconnect
-> provider/retrieval cleanup if supported
```

Do not add cancellation endpoint now. Add only if disconnect does not halt meaningful backend cost/work.

### Future event rule

Do not emit:

```text
tool.started
tool.delta
tool.completed
terminal.output
artifact.created
session.updated
```

Future agent may add those after runtime exists.

Parser rule:

```text
Unknown event -> structured debug log -> ignore.
Unknown event does not crash page.
Unknown event does not render fake generic UI.
```

---

## 12. Current and future data-model map

### Current models

```python
from datetime import datetime
from enum import StrEnum
from typing import Generic, Literal, TypeVar
from pydantic import BaseModel, Field

class Role(StrEnum):
    ADMIN = "admin"
    MEMBER = "member"

class DomainLifecycleState(StrEnum):
    CREATED = "created"
    STARTING = "starting"
    READY = "ready"
    STOPPED = "stopped"
    FAILED = "failed"
    DELETING = "deleting"

class DocumentStatus(StrEnum):
    QUEUED = "queued"
    PARSING = "parsing"
    INDEXING = "indexing"
    INDEXED = "indexed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"

class OperationStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"

class CurrentUser(BaseModel):
    id: str
    username: str
    role: Role

class Pagination(BaseModel):
    limit: int = Field(ge=1, le=100)
    next_cursor: str | None = None

T = TypeVar("T")
class Page(BaseModel, Generic[T]):
    items: list[T]
    page: Pagination

class DomainSummary(BaseModel):
    id: str
    display_name: str
    lifecycle_state: DomainLifecycleState
    document_count: int
    created_at: datetime
    updated_at: datetime

class DomainDetail(DomainSummary):
    embedding_profile_id: str | None = None
    is_healthy: bool
    failure_message: str | None = None

class IngestionProgress(BaseModel):
    completed_units: int | None = None
    total_units: int | None = None
    percent: int | None = Field(default=None, ge=0, le=100)

class DocumentSummary(BaseModel):
    id: str
    domain_id: str
    title: str
    source_path: str
    parser: str | None = None
    status: DocumentStatus
    updated_at: datetime

class DocumentDetail(DocumentSummary):
    chunk_count: int | None = None
    ingestion_job_id: str | None = None
    ingestion_progress: IngestionProgress | None = None
    failure_message: str | None = None

class IngestionJobSummary(BaseModel):
    id: str
    domain_id: str
    document_id: str | None = None
    status: JobStatus
    progress: IngestionProgress | None = None
    created_at: datetime
    updated_at: datetime

class IngestionJobDetail(IngestionJobSummary):
    diagnostics: list[str] = []
    failure_message: str | None = None

class EvidenceReference(BaseModel):
    citation_id: str
    document_id: str
    chunk_id: str
    title: str
    source_path: str
    page_number: int | None = None
    score: float | None = None
    snippet: str | None = None

class EvidenceChunk(EvidenceReference):
    content: str
    asset_ids: list[str] = []

class Citation(BaseModel):
    citation_id: str
    evidence: EvidenceReference

class ProviderSummary(BaseModel):
    id: str
    display_name: str
    configured: bool
    health: Literal["unconfigured", "ready", "degraded", "failed"]

class ModelProfile(BaseModel):
    id: str
    provider_id: str
    display_name: str
    model_name: str
    kind: Literal["llm", "embedding"]
    enabled: bool

class ProviderConfig(BaseModel):
    providers: list[ProviderSummary]
    profiles: list[ModelProfile]
    default_llm_profile_id: str | None = None
    default_embedding_profile_id: str | None = None

class OperationSummary(BaseModel):
    id: str
    type: str
    status: OperationStatus
    domain_id: str | None = None
    actor_id: str | None = None
    started_at: datetime
    completed_at: datetime | None = None

class OperationDetail(OperationSummary):
    message: str | None = None
    diagnostics: list[str] = []

class ApiErrorBody(BaseModel):
    code: str
    message: str
    details: dict[str, object] = {}
    request_id: str

class ApiError(BaseModel):
    error: ApiErrorBody
```

### Model ownership

| Model | Exists now/target now | Owner | Source of truth | Client cache | Future relation |
|---|---:|---|---|---|---|
| CurrentUser | Yes | auth | FastAPI/DB | app bootstrap | May own future runs/sessions |
| Domain | Yes | domain service | FastAPI/DB/manifest | route cache | Future workspace may link to it |
| Document | Yes | document service | FastAPI/DB/storage | route cache | Source artifact relation only |
| IngestionJob | Yes | job service | DB/worker | refresh/poll | None required |
| EvidenceReference | Yes | retrieval service | Per-turn generated | current turn | Future run may cite it |
| Citation | Yes | query service | Per-turn generated | current turn | Future stored turn may retain it |
| Chat turn | Yes, ephemeral | query service | request stream | feature local | Future ConversationTurn may reference it |
| ProviderConfig | Yes | provider service | secure config/DB | settings route | Future agent uses selected profile through server |
| Operation | Yes | operation service | DB/log | admin route | Future run can create separate record |

### Future-only models

| Model | Trigger | Why current model cannot absorb it | Likely owner | Do not build now |
|---|---|---|---|---|
| AgentRun | Approved multi-step tool workflow | Chat turn has no tool lifecycle/audit | agent runtime service | No table/route/UI |
| ToolRun | Agent invokes authorized tool | Operation is admin action, not tool trace | agent runtime service | No model |
| TerminalRun | Controlled execution requirement | ToolRun still lacks terminal limits/output | execution service | No model |
| WorkspaceArtifact | Durable generated output | Document is source input, not generated file | workspace/artifact service | No model |
| ConversationSession | Approved retention policy | Chat turn is ephemeral | conversation service | No model |
| ConversationTurn | Approved persisted history | Current turn has no storage/ordinal | conversation service | No model |

### Generated TypeScript

```text
FastAPI Pydantic
-> OpenAPI JSON
-> generated.ts
-> feature API module
-> feature UI
```

Do not write duplicate manual interfaces except view-only local state.
