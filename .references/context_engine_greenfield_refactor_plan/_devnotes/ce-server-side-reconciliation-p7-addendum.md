# Context Engine — Server-Side Reconciliation and Revised P7 Plan

## 1. Decision

Use this server path:

```text
P1 auth
→ P2 trusted runtime config
→ P3 domains + controller + one worker
→ P4 source preparation
→ P5 LightRAG indexing + eligibility
→ P6 multi-source scoped evidence
→ P7 stateless grounded SSE turns
→ frontend integration later
```

Do not implement current P7 unchanged.

P7 must be:

```text
one domain question
→ P6 mapped evidence
→ frozen synthesis config
→ bounded provider stream
→ typed SSE
→ answer or evidence-only result
→ no durable conversation/history yet
```

No `conversations` table.
No `conversation_turns` table.
No `cited_source_ids`.
No citation-hide logic.
No chat migration.
No chat worker.
No browser work in P7.

Browser later owns temporary visible transcript only. Reload clears it.

---

## 2. P0 Is Canonical

P0 wins over every leaf phase document.

Keep:

```text
one API
one Postgres
one worker process
one private controller
one LightRAG runtime/domain
no generic jobs/operations table
no Redis/RQ/Celery
no event bus
no local retrieval fallback
no provider secrets in browser/runtime files
```

Correct P0 wording for source failures:

```text
source_documents.state:
  pending | prepared | deleting

preparation failure:
  source stays pending
  latest source_preparation_operation = failed

index failure:
  source stays prepared
  source.index_state = failed
```

Do not add `source.state = failed`.

This matches P4/P5 better and avoids duplicate failure state across source row, preparation operation, and index state.

---

## 3. Required P3 Correction — Add the One Worker Now

Current P3 returns `202 deletion_pending` but has no durable process that completes deletion after the request exits.

Add the already-approved single worker in P3.

```text
postgres
migrate
api
domain-controller
worker
```

Worker responsibilities in P3:

```text
claim unfinished domain delete operations
→ controller remove
→ verify runtime DB/container/workspace/log absence
→ delete domain row
```

P3 lifecycle behavior:

| Action | Executor                                                     | Response               |
| ------ | ------------------------------------------------------------ | ---------------------- |
| Create | API, bounded controller call                                 | synchronous success    |
| Start  | API, bounded controller call                                 | synchronous success    |
| Stop   | API, bounded controller call                                 | synchronous success    |
| Delete | API records `deleting` + operation; worker completes cleanup | `202 deletion_pending` |

Do not add a queue table or operation framework.

Use the existing `domain_operations` row:

```text
domain.state = deleting
domain_operation.type = delete
domain_operation.status = running
```

The single worker scans running delete operations. Controller removal stays idempotent through `runtime_instance_id` and `control_generation`.

P4 extends this same worker with preparation. P5 extends this same worker with indexing, readiness sweep, and remote deletion.

---

## 4. Required P5 Correction — Runtime Secret Injection

P3 starts a provider-free runtime for health only. P5 indexing may require embedding configuration and, depending on the pinned LightRAG contract, an LLM configuration for graph/entity extraction.

Add this explicit rule:

```text
P3:
  start runtime with no provider config.
  health only.

P5:
  start runtime with private typed bootstrap config.
  bootstrap config exists only in API/controller memory.
  controller injects it at process start.
  no runtime config is persisted.
```

Private internal model:

```python
@dataclass(frozen=True)
class RuntimeBootstrapConfig:
    embedding: ResolvedModelProfile
    indexing_llm: ResolvedModelProfile | None
```

Rules:

```text
embedding:
  domain.embedding_profile_id
  immutable since domain creation

indexing_llm:
  current active synthesis profile
  only supplied when pinned LightRAG fixture proves required

credentials:
  short-lived process memory only
  never DB plaintext
  never domain.env
  never compose
  never manifest
  never API response
```

Existing P3 runtimes started before P5 deployment must be manually stopped and started once before indexing. Do not add a `runtime_config_applied` database field or secret-sync worker.

P5 remains blocked until its real pinned LightRAG fixture proves:

```text
provider-free health bootstrap
typed secret injection at start
submit
idempotent submit recovery
readiness
exact block marker retrieval
remote delete
late-ready-after-delete protection
```

---

## 5. Required P6 Correction — Query All Eligible Sources

Do not create an active-source model.

P4 permits many documents per domain. P5 indexes prepared sources independently. Therefore P6 must retrieve across the selected domain’s private runtime and validate every returned marker against the source that owns it.

Replace this:

```text
one active source per domain
```

With this:

```text
one selected domain
→ many possible source documents
→ only currently query-eligible sources may map to evidence
```

Revised internal query target:

```python
@dataclass(frozen=True)
class QueryTarget:
    domain_id: str
    runtime_url: str
```

Revised mapping:

```text
LightRAG raw hit
→ parse exactly one CE_BLOCK marker
→ load source block
→ load owning source document
→ verify source.domain_id == target.domain_id
→ source_is_query_eligible(source, domain)
→ build mapped evidence
```

No `active_source_id`.
No browser source selector.
No source filter in request.
No document-selection state.
No extra table.

If the domain has no eligible sources:

```text
409 no_query_eligible_source
```

If LightRAG returns hits but none map safely:

```text
200 no_grounded_context
```

---

## 6. Revised P7 Scope

### Build

```text
POST domain chat turn
P6 internal evidence retrieval
private synthesis context assembly
one frozen synthesis profile
one bounded retry
SSE answer stream
validated citations
evidence-only fallback
cancellation cleanup
capacity limits
server tests
OpenAPI + stream-contract fixtures
```

### Do not build

```text
conversations
conversation history
turn persistence
chat titles
history API
chat deletion
citation-hide
citation persistence
chat-memory retrieval
prior-turn context
client request idempotency rows
Langfuse
WebSockets
tools
agents
prompt editor
model selector
browser work
```

Current P7 conversation/history design becomes a later dedicated phase only after real users prove they need durable history.

---

## 7. P7 Data Ownership

| Concern                         | Owner                |
| ------------------------------- | -------------------- |
| Authentication/session          | P1                   |
| Active synthesis profile        | P2                   |
| Domain availability             | P3                   |
| Prepared source/block ownership | P4                   |
| Index eligibility               | P5                   |
| Retrieval and mapping           | P6                   |
| Current chat turn               | API request memory   |
| Provider stream                 | API request memory   |
| Visible stream output           | Browser memory later |
| Durable chat history            | Deferred             |

No new P7 database tables.

Internal request-scoped model:

```python
@dataclass(frozen=True)
class ChatTurnContext:
    turn_id: str
    request_id: str
    actor_user_id: str
    domain_id: str
    question: str
    evidence: tuple[MappedEvidence, ...]
    synthesis_profile: ResolvedModelProfile | None
```

Rules:

```text
MappedEvidence remains P6-owned.
P7 never remaps raw LightRAG hits.
P7 uses canonical block text from P6 MappedEvidence only.
P7 emits browser-safe evidence DTOs through P6 conversion code only.
```

---

## 8. Final Chat API Contract

```http
POST /api/v1/domains/{domain_id}/chat/turns
Content-Type: application/json
Accept: text/event-stream
```

Request:

```python
class ChatTurnRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=4_000,
        ),
    ]
```

Rejected request fields:

```text
model
provider
prompt
temperature
topK
reranker
retrievalMode
sourceId
documentId
blockId
runtimeUrl
history
clientRequestId
```

### Pre-stream JSON errors

| HTTP | Code                             |
| ---: | -------------------------------- |
|  401 | `unauthenticated`                |
|  404 | `domain_not_available`           |
|  409 | `no_query_eligible_source`       |
|  422 | `validation_failed`              |
|  429 | `synthesis_capacity_unavailable` |
|  502 | `retrieval_invalid_response`     |
|  503 | `retrieval_unavailable`          |
|  503 | `synthesis_unavailable`          |

All use the existing canonical error envelope.

Do not invent a separate streaming-error response model.

---

## 9. Final SSE Contract

Use one POST stream. No EventSource endpoint. No reconnect or resume.

Headers:

```http
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
```

SSE frame:

```text
data: {"type":"turn.started","turnId":"..."}

```

No sequence number. No replay cursor. No event bus.

One fetch request equals one stream. Ordering is guaranteed by that single response. The browser later ignores any event whose `turnId` does not match its active request.

### Event union

```python
class TurnStarted(BaseModel):
    type: Literal["turn.started"]
    turn_id: str

class EvidenceReady(BaseModel):
    type: Literal["evidence.ready"]
    turn_id: str
    evidence: list[EvidenceDto]

class AnswerDelta(BaseModel):
    type: Literal["answer.delta"]
    turn_id: str
    text: str

class AnswerReset(BaseModel):
    type: Literal["answer.reset"]
    turn_id: str
    reason: Literal["synthesis_failed"]

class TurnCompleted(BaseModel):
    type: Literal["turn.completed"]
    turn_id: str
    outcome: Literal[
        "synthesized",
        "evidence_only",
        "no_grounded_context",
    ]
    cited_reference_ids: list[str]
    retry_count: Literal[0, 1]
```

### Valid sequences

Normal grounded answer:

```text
turn.started
→ evidence.ready
→ answer.delta*
→ turn.completed(outcome=synthesized)
```

No mapped evidence:

```text
turn.started
→ turn.completed(outcome=no_grounded_context)
```

Provider fails before first text and retry fails:

```text
turn.started
→ evidence.ready
→ turn.completed(outcome=evidence_only)
```

Provider fails after text:

```text
turn.started
→ evidence.ready
→ answer.delta+
→ answer.reset
→ turn.completed(outcome=evidence_only)
```

Rules:

```text
evidence.ready always precedes first answer.delta.
turn.completed is exactly one terminal event.
no typed event follows turn.completed.
no retry event.
no cancelled event.
browser cancel means connection ends; browser owns cancelled UI state.
unexpected connection drop means browser owns interrupted UI state.
```

---

## 10. Citation Rule

P7 sends `EvidenceDto` from P6 before synthesis output.

Prompt receives each evidence item with a stable reference:

```text
[E1]
canonical source block text

[E2]
canonical source block text
```

Model instruction:

```text
Answer only from supplied evidence.
Use [[E1]] style markers only for supplied references.
If evidence does not support answer, say so.
```

At stream completion:

```text
1. inspect full accumulated answer
2. extract reference markers
3. retain only references emitted in evidence.ready
4. emit cited_reference_ids
```

Do not persist citations.

Browser later maps `cited_reference_ids` back to the evidence already received in the same stream. Unknown markers remain plain text and never become trusted source links.

---

## 11. Chat Service Design

Add only:

```text
backend/app/chat/
  schemas.py
  grounding.py
  synthesis.py
  service.py

backend/app/api/v1/chat.py
```

### Responsibilities

| Module              | Responsibility                                           |
| ------------------- | -------------------------------------------------------- |
| `chat/schemas.py`   | Request, event, and safe DTO models                      |
| `chat/grounding.py` | One bounded prompt builder and citation extraction       |
| `chat/synthesis.py` | Concrete provider streaming dispatch                     |
| `chat/service.py`   | Orchestration, retry, fallback, capacity release         |
| `api/v1/chat.py`    | HTTP only; auth, request validation, `StreamingResponse` |

Do not add:

```text
chat repository
conversation repository
turn repository
history repository
citation repository
prompt registry
provider plugin framework
agent framework
event dispatcher
stream broker
chat worker
```

### Synthesis provider implementation

Use one small direct dispatcher:

```python
match profile.provider_kind:
    case "openai":
        ...
    case "bedrock":
        ...
    case "ollama":
        ...
```

No plugin registry or adapter framework.

For initial pilot, enable only provider kinds with a pinned real streaming contract test. Do not allow an unsupported provider kind to become the active synthesis profile merely because P2 can store its profile.

---

## 12. P7 Server Flow

```text
1. authenticate user.
2. validate question.
3. require available domain.
4. call P6 query_evidence().
5. retrieval failure -> normal JSON error before stream.
6. mapped evidence empty -> open short SSE:
     turn.started
     turn.completed(no_grounded_context)
7. acquire synthesis capacity.
8. resolve active synthesis profile once.
9. freeze resolved profile in ChatTurnContext.
10. return StreamingResponse.
11. emit turn.started.
12. emit evidence.ready.
13. stream provider deltas.
14. validate final citation markers.
15. emit turn.completed(synthesized).
16. always release capacity in finally.
```

### Retry and fallback

```text
provider fails before first delta
→ retry once
→ same frozen profile
→ same evidence
→ same prompt
→ no re-resolve config

retry fails
→ turn.completed(evidence_only)

provider fails after first delta
→ no retry
→ answer.reset
→ turn.completed(evidence_only)
```

No provider failover.
No alternate model.
No new retrieval.
No user-visible retry button.

### Cancellation

```text
browser disconnect
→ request disconnect check
→ cancel provider iterator/request
→ release capacity
→ do not persist anything
→ re-raise cancellation
```

No `BackgroundTask`. No orphan stream recovery.

---

## 13. Resource Limits

Server-owned only:

```python
MAX_CONCURRENT_SYNTHESIS_STREAMS = 8
SYNTHESIS_TIMEOUT_SECONDS = 60
ANSWER_MAX_TOKENS = 1_200
SYNTHESIS_EVIDENCE_MAX_CHARS = 12_000
SYNTHESIS_EVIDENCE_PER_BLOCK_MAX_CHARS = 2_000
```

Rules:

```text
capacity unavailable -> 429 before stream.
provider timeout -> retry/fallback rules.
prompt context truncated deterministically in P7 grounding.py.
browser cannot override any cap.
```

Do not add Redis/distributed locks. One API process is the current operating assumption.

---

## 14. Mandatory Plan Edits

### P0

Change:

```text
conversation_turn_id
```

To:

```text
turn_id
```

Add:

```text
P7 currently has no durable chat persistence.
Delete flows need no chat cleanup.
Durable history needs a separate later phase and explicit deletion policy.
```

Clarify source failure ownership as defined in Section 2.

### P1

Make error codes centrally owned in:

```text
core/errors.py
```

Later phases extend this one canonical enum. Phase docs do not create separate incompatible error-code unions.

Add same-origin unsafe-request validation before browser wiring:

```text
trusted Origin check for cookie-authenticated POST/PUT/PATCH/DELETE
```

No CSRF framework until a real requirement exceeds same-origin protection.

### P3

Add the one worker container and make worker-owned deletion real.

### P5

Add the P5 runtime-bootstrap rule:

```text
typed private config injected only during runtime start
```

Pinned fixture determines exact required provider fields.

### P6

Remove “one active source per domain.”

Use:

```text
selected domain
→ all currently eligible sources in that domain
→ strict per-hit source ownership and eligibility re-check
```

### P7

Replace current conversation/history plan with this stateless streaming plan.

---

## 15. Build Order

```text
Step 0
  Amend P0, P3, P5, P6, P7 docs.
  Lock one error-code registry.
  Lock one SSE fixture contract.

Step 1
  Finish P3 worker-backed hard delete.
  Prove delete survives API restart.

Step 2
  Finish P5 pinned LightRAG fixture:
  bootstrap injection, submit, readiness, exact marker retrieval, delete.

Step 3
  Correct P6 multi-source mapping.
  Prove same domain can return evidence from multiple eligible source documents.

Step 4
  Add P7 schemas + SSE encoder + parser fixture tests.
  No provider call yet.

Step 5
  Add P7 deterministic internal test stream:
  mapped evidence → evidence.ready → fixed deltas → completed.

Step 6
  Add one real supported synthesis provider.
  Freeze profile once.
  Add retry, reset, fallback, disconnect cleanup.

Step 7
  Add API integration and compose streaming tests.
  Frontend wiring begins only after this gate passes.
```

---

## 16. Server Acceptance Gate

```text
[ ] P3 202 delete completes through the single durable worker.
[ ] P5 LightRAG contract fixture proves private runtime bootstrap and deletion.
[ ] P6 retrieves across many eligible sources without active-source state.
[ ] Every mapped hit resolves to its exact owning SourceBlock.
[ ] P7 adds zero database tables.
[ ] Chat request accepts only question.
[ ] Retrieval failure returns safe JSON before stream.
[ ] Evidence arrives before answer deltas.
[ ] No mapped evidence returns no_grounded_context.
[ ] Provider failure before text retries once with same frozen profile.
[ ] Provider failure after text clears partial answer and returns evidence_only.
[ ] Cancel releases capacity and leaves no durable chat state.
[ ] No provider secrets, raw prompt, raw answer, raw evidence, storage path, source ID, or block ID leak through API/logs.
[ ] Stream contract fixture and OpenAPI snapshot pass.
[ ] No frontend dependency is required to validate server behavior.
```

## Final Server Decision

```text
P7 is not conversation history.

P7 is:
  selected domain
  → mapped evidence
  → one frozen synthesis profile
  → one bounded SSE turn
  → answer or evidence-only fallback
  → nothing durable

History becomes a later product decision.
```
