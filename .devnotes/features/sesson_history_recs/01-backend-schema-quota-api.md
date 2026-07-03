# 01 — Backend: Schema, Quota, API, Service

**Target modules:** `context_engine/models.py`, `context_engine/services/conversations.py`, `context_engine/api/routes.py`, Alembic migration, `tests/`

**Prerequisite:** Patch `specs/03-contracts/api/context-engine-v1.md` + `context-engine-data.md` for quota field, list cursor, PATCH title, list summary DTOs.

---

## T-010 Migration

Add P7 tables if not present (from DATA-001):

```text
conversations
conversation_turns          + constraints from DATA-001
conversation_turn_evidence_refs
```

Add quota column:

```text
users.conversation_storage_bytes  BIGINT NOT NULL DEFAULT 0
CHECK (conversation_storage_bytes >= 0)
```

Indexes:

```text
ix_conversations_owner_updated   (owner_user_id, updated_at DESC)
uq_turn_client_request           (conversation_id, client_request_id)
uq_one_running_turn              partial unique on conversation_id WHERE status='running'
```

Fresh-upgrade test required.

---

## T-020 Models

Mirror DATA-001 enums in `models.py`. Relationships:

```text
User.conversations → Conversation.owner
Conversation.turns → Turn cascade
Turn.evidence_refs → cascade
```

No JSON blob columns for citations, prompts, or provider payloads.

---

## T-030 ConversationService

File: `context_engine/services/conversations.py`

| Method | Behavior |
| --- | --- |
| `list_for_owner(user_id, cursor, limit)` | Owner filter; stable cursor on `(updated_at, id)`; return summary DTOs |
| `create(user_id, title?)` | Insert row; title nullable; storage unchanged |
| `get_detail(user_id, conversation_id)` | 404 if not owner; map turns + evidence safe DTOs |
| `update_title(user_id, conversation_id, title)` | Validate length/safe chars; 404 if not owner |
| `delete(user_id, conversation_id)` | Subtract storage bytes in txn; cascade delete; 204 |

**Repository rule:** every SELECT includes `owner_user_id = :current_user`.

---

## T-040 Storage quota

Constant: `MAX_USER_CONVERSATION_STORAGE_BYTES = 524_288_000`

Helper: `compute_turn_bytes(turn, evidence_refs) -> int`

| Hook | Action |
| --- | --- |
| Before insert/update turn content | `if user.conversation_storage_bytes + delta > MAX: raise ConversationStorageLimit` |
| On turn finalize | `user.conversation_storage_bytes += delta` |
| On turn redaction | Subtract removed `assistant_answer` + excerpt bytes |
| On conversation delete | Subtract sum of all turn bytes in conversation |

Error mapping:

```text
HTTP 413
code: conversation_storage_limit_reached
message: bland user-safe string (no byte counts required in v1)
```

**Open:** allow delete-oldest when over quota? v1 = reject new content only.

---

## T-050 API routes

Wire under `/api/v1/conversations` in `routes.py`:

| Route | Notes |
| --- | --- |
| `GET /conversations` | Query: `limit` (default 40, max 100), `cursor` optional |
| `POST /conversations` | Body: `{ "title": null \| string }` |
| `GET /conversations/{id}` | Full turn summaries per reconciled gates A1 |
| `PATCH /conversations/{id}` | Body: `{ "title": string }` — **contract patch first** |
| `DELETE /conversations/{id}` | 204; quota decrement |

DTO mapping layer — **never** return ORM rows directly.

---

## T-060 Integration with ChatTurnService (F-007)

On turn lifecycle:

```text
create running turn:
  verify conversation.owner_user_id
  quota pre-check using user_message byte length (conservative)
  bump conversation.updated_at

finalize turn:
  add assistant + evidence bytes to quota counter
  bump conversation.updated_at

duplicate clientRequestId:
  replay per gate A2 — no double quota charge
```

Running conflict: `409 conversation_turn_in_progress`

---

## T-070 Redaction (F-007 T-070)

On source/domain delete hook:

```text
find affected turns → clear assistant_answer + evidence refs
adjust owner storage counter downward
status/stop_reason = redacted
user_message retained
```

---

## Tests (minimum)

```text
tests/test_conversations_crud.py
  - owner sees own list/detail
  - other user gets 404
  - PATCH title owner-only
  - DELETE decrements storage counter

tests/test_conversation_storage_quota.py
  - at cap-1, small turn succeeds
  - at cap, new turn rejected 413
  - delete conversation frees quota

tests/test_conversations_pagination.py
  - cursor stable ordering by updated_at desc
  - no duplicate rows across pages

OpenAPI snapshot update
```

---

## Red Flags In PR

- Missing `owner_user_id` filter on any query
- Quota checked only in Python without transactional update
- List endpoint returns full turn bodies
- PATCH allows empty or oversized title without validation
- Storage counter drift (no test for delete/redaction decrement)
- 403 instead of 404 for cross-user access

---

## Validation Commands

```bash
cd /data/home/tkodippili/Desktop/localTest_local_studio
alembic upgrade head
pytest -q tests/test_conversations_crud.py tests/test_conversation_storage_quota.py
```
