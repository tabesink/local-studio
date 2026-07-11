# ID-A - Turn API and data contract (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-007-grounded-streaming-chat/spec.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/data/context-engine-data.md`, `specs/02-architecture/integration-flows.md`, `specs/05-quality/test-strategy.md`.

**Question:** Can P7 Conversation and Turn code be implemented from the current contracts as-is?

## Decision

Partly.

DATA-001 names the tables and core constraints. API-001 names the routes and the turn stream request. But exact turn-summary DTOs, duplicate request replay, and several terminal response shapes are still too thin for route code.

Patch or confirm those shapes first. This is a contract gap, not an implementation detail.

## Why

| Bad path | Good path |
| --- | --- |
| Add model fields and let API responses fall out of ORM shape. | Define safe DTOs first, then map from models. |
| Treat idempotency as "just retry the handler." | Persist one Turn per `(conversation_id, client_request_id)` and replay/return it by contract. |
| Let running Turn guard live in Python only. | Add DB constraint plus service check. |
| Store raw orchestration traces for debugging. | Store safe counters and terminal codes only. |
| Return 403 for other user's Conversation. | Return 404 per API-001 owner-scope rule. |

## Exact Contract Sketch

Approved data spine:

```text
conversations
  id
  owner_user_id
  title
  created_at
  updated_at

conversation_turns
  id
  conversation_id
  client_request_id
  domain_id
  route
  status
  stop_reason
  user_message
  assistant_answer
  safe_error_code
  safe_error_message
  plan_step_count
  retrieval_operation_count
  repair_attempt_count
  created_at
  started_at
  completed_at
  updated_at

conversation_turn_evidence_refs
  id
  turn_id
  source_document_id
  source_block_id
  citation_label
  excerpt
  created_at
```

Required constraints:

```text
unique(conversation_id, client_request_id)
partial unique running Turn per conversation where status = running
route in direct_llm | domain_rag
status in running | completed | failed | redacted
stop_reason in approved closed set
domain_id is null when direct_llm
domain_id is not null when domain_rag
```

API-001 still needs field-level confirmation for:

```text
GET /conversations/{id} turn summaries
duplicate completed Turn replay
duplicate running Turn behavior
redacted Turn summary
safe error codes for running conflict and invalid route/domain state
```

## Implementation Order

1. Patch API-001 with safe Conversation and Turn summary DTOs.
2. Patch API-001 with duplicate request and one-running-turn behavior.
3. Add migration/model fields and DB constraints.
4. Add fresh-upgrade migration test.
5. Implement repository helpers with owner filters.
6. Implement Conversation CRUD route tests.
7. Implement ChatTurnService create/replay/settle helpers before provider or retrieval calls.

## Red Flags In PR

- Turn API returns ORM rows directly.
- `client_request_id` uniqueness is checked only in service code.
- Another user's Conversation returns ownership details.
- Running Turn uniqueness is missing from the migration.
- `domain_id` can be present for `direct_llm` or absent for `domain_rag`.
- `assistant_answer` is populated before safe projection is complete.
- Planning text, provider payloads, LightRAG hits, source content, private paths, or raw errors are persisted.

## Tests

- Migration fresh upgrade creates tables and constraints.
- CRUD owner tests: own rows visible; other user's row returns 404.
- Duplicate request test proves no second provider/retrieval invocation.
- Running guard test returns the contracted 409.
- Route/domain nullability constraint tests.
- Redacted turn summary test once redaction lands.
- OpenAPI snapshot captures public DTOs.

## One-line summary

The table ownership is settled; the public replay and summary shapes need contract closure before coding routes.
