# Context Engine — P7: RAG-Only Streaming Chat + Conversation History

**Status:** Reconciled greenfield vertical-slice implementation plan
**Build style:** API-first, RAG-only, one turn executor, one public SSE contract.
**Depends on:** P1 auth; P2 trusted provider/model config; P3 domains; P4 canonical sources; P5 indexing/eligibility; P6 mapped evidence/source navigation.
**Supersedes:** Any earlier P7 direct-chat, general-answer, or domainless-chat branch.

---

# 0. Goal

A signed-in user owns conversations. Each turn selects one available Knowledge Domain and asks a grounded question against that domain.

```text
user conversation turn
-> required selected domain
-> P6 mapped evidence retrieval
-> bounded synthesis from current-turn evidence only
-> Context Engine SSE
-> owned durable turn history
-> strict redaction on source/domain delete
```

Pilot chat is RAG-only. If no mapped evidence exists, the result is no-grounded-context. If retrieval succeeds but synthesis fails, the result is evidence-only. The system never falls back to general model knowledge.

---

# 1. Final Decisions

```text
Conversation
  belongs to exactly one user.

Turn
  belongs to one conversation.
  records exactly one domain_id.
  is the unit of request idempotency, SSE streaming, citation validation, and redaction.
```

Rules:

```text
turn.domain_id is required.
Current turn domain is the only retrieval scope.
Past turns may provide bounded continuity as prior user questions only.
Past turns never expand retrieval scope.
Prior assistant answers are never injected into prompts.
One active running turn per conversation.
Admin does not automatically read member conversations.
```

Do not build:

```text
general chat
domainless chat
direct non-grounded answers
chat-memory vector store
semantic retrieval over old conversations
shared team conversations
cross-domain retrieval
browser-selected route/query flow
```

---

# 2. Scope

## Build

- Conversation CRUD for the owner.
- Turn SSE endpoint.
- Required domain-per-turn request model.
- Client request UUID idempotency per conversation.
- One-running-turn guard per conversation.
- Private P6 mapped-evidence callable shared with the evidence route.
- Grounded synthesis from current-turn mapped evidence only.
- Evidence-only fallback after synthesis failure.
- No-grounded-context result when retrieval returns no mapped evidence.
- Source/domain delete redaction hooks.
- Server-owned stream, request, and prior-context limits.
- Focused frontend contract for conversation list/thread, evidence, stream state, and redacted history.

## Do Not Build

- Direct general synthesis.
- A query classifier that can bypass retrieval.
- Browser-visible retrieval controls.
- A durable evidence table.
- Raw prompt, answer, evidence, LightRAG response, or provider response persistence.
- Provider failover or background synthesis retry.
- Any new worker/queue solely for chat.

---

# 3. Runtime Flow

```text
POST /api/v1/conversations/{conversation_id}/turns
  -> authenticate user
  -> verify conversation owner
  -> validate domain is available and not deleting
  -> validate domain has at least one query-eligible source
  -> enforce one running turn per conversation
  -> enforce client_request_id idempotency
  -> insert running turn
  -> resolve active synthesis profile once
  -> fetch bounded prior user questions
  -> call P6 mapped evidence retrieval for selected domain
  -> if no mapped evidence: settle completed with no-grounded-context
  -> stream grounded synthesis with validated citations
  -> on provider failure after evidence: settle evidence-only
  -> on unrecoverable failure: settle failed with safe error
```

Never hold a DB transaction during parser work, LightRAG calls, provider calls, or SSE streaming.

---

# 4. Ownership

| Concern | Owner |
| --- | --- |
| Conversation ownership | `ChatTurnService` + repository owner filter |
| Turn lifecycle | `ChatTurnService` |
| Retrieval scope | P6 retrieval-scope resolver |
| Evidence mapping | P6 evidence resolver |
| Synthesis profile freeze | P2 resolver called by P7 at turn start |
| SSE framing | P7 conversation API |
| Citation validation | P7 citation validator against current-turn evidence IDs |
| Source/domain redaction | P7 service methods called by P4/P5/P3 delete flows |
| Trace ID attachment | P8 observability wrapper |

---

# 5. Database — Migration 0007

## 5.1 `conversations`

```sql
conversations (
  id UUID PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

## 5.2 `conversation_turns`

```sql
conversation_turns (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  domain_id TEXT NOT NULL,
  client_request_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NULL,
  status TEXT NOT NULL,                 -- running | completed | failed | redacted
  synthesis_profile_id UUID NULL,
  citations_json JSONB NULL,
  cited_source_ids UUID[] NOT NULL DEFAULT '{}',
  safe_error_code TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NULL,

  CHECK (status IN ('running','completed','failed','redacted'))
);
```

Indexes:

```sql
CREATE UNIQUE INDEX one_running_turn_per_conversation
ON conversation_turns (conversation_id)
WHERE status='running';

CREATE UNIQUE INDEX uq_turn_client_request
ON conversation_turns (conversation_id, client_request_id);

CREATE INDEX ix_conversations_owner_updated
ON conversations (owner_user_id, updated_at DESC);

CREATE INDEX ix_turns_domain
ON conversation_turns (domain_id)
WHERE status <> 'redacted';

CREATE INDEX ix_turns_cited_source_ids
ON conversation_turns USING GIN (cited_source_ids);
```

No columns for classifier route, route reason, prompt, raw evidence, raw LightRAG data, provider response, agent trace, or retrieval controls.

## 5.3 Result Derivation

| Stored state | Safe API result |
| --- | --- |
| `completed`, answer non-null, citations present | `grounded_answer` |
| `completed`, answer null, citations present | `evidence_only` |
| `completed`, answer null, citations empty/null | `no_grounded_context` |
| `failed` | `failed` with safe error code |
| `redacted` | `redacted` |

The user question remains visible for redacted turns. Answer, citations, and cited source IDs are removed.

---

# 6. API Contract

All routes require an authenticated user. Conversation reads and writes filter by `owner_user_id=current_user.id`.

```text
POST   /api/v1/conversations
GET    /api/v1/conversations
GET    /api/v1/conversations/{conversation_id}
DELETE /api/v1/conversations/{conversation_id}
POST   /api/v1/conversations/{conversation_id}/turns  text/event-stream
```

Turn request:

```json
{
  "domainId": "fatigue",
  "question": "What evidence supports this requirement?",
  "clientRequestId": "uuid"
}
```

Safe turn DTO never exposes raw prompt text beyond the user question, trace IDs, provider payloads, LightRAG IDs, source block internals, runtime paths, or private retrieval metadata.

Error behavior:

| Case | HTTP/code |
| --- | --- |
| Conversation not owned by user | `404 not_found` |
| Domain unavailable/deleting/stopped | `409 domain_unavailable` |
| No ready source in domain | `409 no_query_eligible_source` |
| Active turn already running | `409 conversation_busy` |
| Duplicate client request ID | return existing safe turn/stream result, no second provider call |
| Browser sends provider/model/retrieval controls | `422 validation_error` |
| Rate/admission limit exceeded | `429 rate_limited` with `Retry-After` |

---

# 7. SSE Contract

Events are Context Engine events, not raw provider events.

```text
event: evidence
data: {"items":[...]}

event: token
data: {"text":"..."}

event: done
data: {"turnId":"uuid","resultKind":"grounded_answer"}

event: error
data: {"code":"synthesis_unavailable","requestId":"..."}
```

`evidence` is emitted only after P6 maps LightRAG results to authorized Context Engine source provenance. `token` text is never evidence. Citations in streamed/done payloads must resolve to current-turn evidence IDs.

---

# 8. Synthesis Rules

Inputs allowed in synthesis prompt:

```text
current user question
selected domain display name
bounded prior user questions
current-turn mapped evidence excerpts and citation IDs
server-owned system prompt
```

Inputs forbidden:

```text
prior assistant answers
raw source files
raw parser output
raw LightRAG response
source storage paths
provider secrets
runtime URLs
unmapped evidence
cross-domain evidence
browser-provided prompt/model/retrieval fields
```

Retry policy:

```text
provider failure before completion
-> one retry with same frozen synthesis profile and same evidence
second failure with evidence
-> completed evidence_only
second failure without evidence
-> completed no_grounded_context or failed safe error depending failure point
```

No provider failover.

---

# 9. Redaction Contract

Source delete calls:

```text
ChatTurnService.redact_for_source(source_id)
```

Domain delete calls:

```text
ChatTurnService.redact_for_domain(domain_id)
```

Source redaction:

```sql
UPDATE conversation_turns
SET status='redacted', answer=NULL, citations_json=NULL, cited_source_ids='{}'
WHERE :source_id = ANY(cited_source_ids)
  AND status <> 'redacted';
```

Domain redaction:

```sql
UPDATE conversation_turns
SET status='redacted', answer=NULL, citations_json=NULL, cited_source_ids='{}'
WHERE domain_id=:domain_id
  AND status <> 'redacted';
```

Redaction is idempotent. It preserves the original user question and conversation shell. Deleted-domain turns cannot continue.

---

# 10. Configuration and Limits

```dotenv
SYNTHESIS_TIMEOUT_SECONDS=60
MAX_CONCURRENT_SYNTHESIS_STREAMS=8
MAX_CHAT_QUESTION_CHARS=8000
MAX_PRIOR_USER_QUESTIONS=6
MAX_PRIOR_USER_QUESTION_CHARS=6000
MAX_EVIDENCE_ITEMS_PER_TURN=12
CHAT_TURN_TIMEOUT_SECONDS=90
```

These are server-owned settings. The browser cannot override them. P8 must calibrate final pilot thresholds against the actual environment and provider limits.

---

# 11. Build Order

## Step 1 — Migration and Repository

```text
Create conversations and conversation_turns.
Add ownership filters.
Add running-turn and client-request unique indexes.
Add result derivation helper tests.
```

## Step 2 — Conversation API

```text
Create/list/read/delete own conversations.
Return 404 for another user's conversation.
No admin global conversation read in P7.
```

## Step 3 — P6 Private Evidence Callable

```text
Refactor P6 evidence route behind one private callable.
P6 route and P7 chat use the same map_hit/evidence resolver path.
Raw LightRAG hits cannot reach P7 directly.
```

## Step 4 — Turn Executor

```text
Validate owner/domain/eligibility/idempotency.
Insert running turn.
Resolve active synthesis profile once.
Retrieve mapped evidence.
Settle no-grounded-context when no mapped evidence.
```

## Step 5 — Grounded SSE

```text
Build bounded prompt from allowed inputs.
Stream tokens through Context Engine SSE.
Validate citations against current-turn evidence IDs.
Persist answer/citations on completion.
Abort provider on client disconnect and settle safely.
```

## Step 6 — Evidence-Only Fallback

```text
Provider failure after mapped evidence -> emit evidence-only done state.
Persist citations and null answer.
No background retry.
No provider failover.
```

## Step 7 — Redaction Wiring

```text
Wire source delete to redact_for_source().
Wire domain delete to redact_for_domain().
Prove repeated redaction is harmless.
```

## Step 8 — Cleanup

```text
Reject browser provider/model/prompt/retrieval controls.
Remove any leftover direct-chat/general-answer contract from frontend and API specs.
```

---

# 12. Test Gate

## Unit

```text
result derivation covers grounded_answer/evidence_only/no_grounded_context/failed/redacted.
prior-context builder includes only bounded user questions.
prompt builder rejects raw evidence/provider/runtime fields.
citation validator rejects model citations outside current-turn evidence IDs.
redaction methods are idempotent.
```

## API and Authorization

```text
member creates/reads/deletes own conversation.
other user gets 404.
admin does not auto-read member chats.
second running turn in same conversation -> 409 conversation_busy.
duplicate client_request_id -> existing safe result, no second provider call.
domain unavailable/deleting -> 409 domain_unavailable.
no ready source -> 409 no_query_eligible_source.
browser provider/model/prompt/retrieval fields -> 422.
```

## Retrieval and Synthesis

```text
P7 uses the same P6 map_hit path as the evidence route.
unmapped/foreign/deleting source result never reaches prompt or browser.
no mapped evidence -> completed no_grounded_context.
valid evidence -> grounded answer with validated citations.
provider failure after retrieval -> evidence_only.
provider failure before safe settlement -> failed with safe error.
client disconnect aborts provider stream and turn is no longer running.
```

## Redaction and Deletion

```text
source delete redacts turns citing that source.
domain delete redacts all turns for that domain.
redacted history preserves user question and clears answer/citations/source IDs.
deleted-domain turn cannot continue.
late source ready after delete cannot restore citation eligibility.
```

## Security and Observability

```text
API/OpenAPI/logs contain no provider secret, provider config, raw prompt, raw answer, raw evidence, raw LightRAG response, runtime path, source storage path, trace payload, or stack trace.
SSE contract is stable and does not expose provider event shapes.
Langfuse disabled/enabled does not change chat behavior.
```

---

# 13. Definition of Done

```text
Conversation history is user-owned.
Every turn has a required domain_id.
Only one running turn per conversation is possible.
Chat uses mapped P6 evidence only.
No direct/general/domainless chat branch exists.
Evidence-only and no-grounded-context outcomes are represented safely.
Source/domain deletion redacts derived answer content.
Browser cannot override provider, model, prompt, retrieval scope, route, or query flow.
Focused tests prove authorization, idempotency, grounding, SSE, failure, redaction, and no secret/raw-content leakage.
```

## Final Boundary

```text
P7 gives Context Engine grounded, user-owned, domain-scoped chat.

It does not turn Context Engine into a general chatbot.
```
