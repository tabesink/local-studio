# P7 - Grounded Streaming Chat

Goal: user-owned conversations. Each turn selects one Knowledge Domain, retrieves mapped evidence, streams grounded answer or safe fallback.

## Decision

Pilot chat is RAG-only.

No:

- general chat
- domainless chat
- direct non-grounded answer
- classifier that bypasses retrieval
- prior assistant answers in prompt
- chat-memory vector store
- cross-domain retrieval
- browser model/provider/prompt/retrieval controls

## Build

- `conversations`.
- `conversation_turns`.
- conversation owner filters.
- required `domain_id` per turn.
- client request idempotency per conversation.
- one running turn per conversation.
- P6 private evidence callable reuse.
- active synthesis profile resolved once per turn.
- bounded prior user questions only.
- grounded prompt builder.
- Context Engine SSE contract.
- citation validation against current-turn evidence IDs.
- evidence-only fallback after synthesis failure.
- no-grounded-context result.
- source/domain redaction hooks.

## Data

`conversations`:

- `id`
- `owner_user_id`
- optional `title`
- timestamps

`conversation_turns`:

- `id`
- `conversation_id`
- `ordinal`
- `domain_id`
- `client_request_id`
- `question`
- `answer`
- `status = running | completed | failed | redacted`
- `synthesis_profile_id`
- `citations_json`
- `cited_source_ids`
- `safe_error_code`
- timestamps

Unique:

- one running turn per conversation.
- `(conversation_id, client_request_id)`.

No columns for prompt, raw evidence, raw LightRAG response, provider response, route/classifier, retrieval controls, agent trace.

## Runtime Flow

```text
POST turn SSE
-> auth
-> verify conversation owner
-> verify domain available
-> verify query-eligible source exists
-> idempotency guard
-> insert running turn
-> resolve synthesis profile once
-> get bounded prior user questions
-> call P6 query_evidence()
-> no evidence: completed no_grounded_context
-> stream grounded synthesis
-> validate citations
-> persist answer/citations
-> provider failure after evidence: evidence_only
-> safe failure: failed with safe code
```

Never hold DB transaction during LightRAG call, provider call, or SSE streaming.

## SSE Contract

Events are Context Engine events, not provider events.

```text
event: evidence
event: token
event: done
event: error
```

Rules:

- evidence emitted before tokens.
- token text is never evidence.
- citations must reference current-turn evidence only.
- one terminal event.
- browser cancel aborts stream; server settles safely.

## Redaction

Source delete:

```text
redact turns where source_id in cited_source_ids
```

Domain delete:

```text
redact turns where turn.domain_id = deleted domain
```

Redaction:

- status becomes `redacted`.
- answer null.
- citations cleared.
- cited source IDs cleared.
- user question remains.
- idempotent.

## Do Not Build

- team/shared conversations
- admin global chat read
- old-turn semantic search
- summary/compact workflow
- prompt editor
- model picker
- provider failover
- background synthesis retry
- chat worker/queue
- source navigation UI

## Test Gate

- user can CRUD only own conversations.
- other user gets `404`.
- every turn requires domain.
- second running turn -> `409 conversation_busy`.
- duplicate client request -> existing safe result, no second provider call.
- unavailable/deleting domain -> safe conflict.
- no eligible source -> safe conflict.
- no mapped evidence -> no-grounded-context.
- mapped evidence -> grounded answer with validated citations.
- provider failure after retrieval -> evidence-only.
- client disconnect aborts provider stream and clears running state.
- source/domain delete redacts as above.
- browser-sent provider/model/prompt/retrieval fields -> `422`.
- no prompt/raw answer/raw evidence/raw LightRAG/provider payload/secret/path in API/logs.

## Handoff

P8 observes turn lifecycle with safe metadata only. P8 must not change chat outcome.

