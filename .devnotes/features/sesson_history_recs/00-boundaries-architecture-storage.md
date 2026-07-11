# 00 — Boundaries, Architecture, API, DB, Storage

End-to-end map for **user Conversation history** in Context Engine rebuild.

---

## Verdict

| Source | Use for | Do NOT use for |
| --- | --- | --- |
| **Local Studio** (`reference-scripts/local-studio/`) | Command palette, sessions dashboard UX, relative timestamps, running/idle badges, search/filter layout | Pi JSONL scan, `cwd` path APIs, `localStorage` session authority, filesystem archive JSON |
| **localGPT** (`reference-scripts/localGPT/`) | Sidebar list CRUD wiring, refresh-after-create, delete confirm, rename prompt pattern | SQLite schema, session-scoped indexes/uploads, `/sessions/{id}/messages` REST chat |
| **CE contracts** | All persistence, auth, DTOs, redaction | — |
| **Old CE client** (`.references/code/context-engine/client/`) | Chat shell geometry, `conversationId` in store | Stale v1 API paths, runtime URLs in DTOs |

---

## Layer Boundaries

```text
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (F-009)                                                  │
│  features/conversations/  — list, command palette, API wrappers  │
│  features/chat/           — thread render, composer, SSE shell   │
│  NO: LightRAG, paths, provider keys, route/model selection       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HttpOnly cookie session
                             │ GET/POST/PATCH/DELETE /api/v1/conversations*
                             │ POST .../turns:stream (SSE)
┌────────────────────────────▼────────────────────────────────────┐
│ API ROUTES (context_engine/api/)                                 │
│  Auth dependency → owner_user_id filter → 404 if not owner       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ ConversationService + ChatTurnService (F-007)                    │
│  CRUD, cursor list, title patch, storage quota check             │
│  Turn idempotency, one-running guard, redaction hooks            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Postgres (system of record)                                      │
│  conversations | conversation_turns | conversation_turn_evidence_refs │
│  users.conversation_storage_bytes (proposed denormalized counter) │
└─────────────────────────────────────────────────────────────────┘
```

**Not in this boundary:** Source Document files, LightRAG runtime, auth_sessions (login cookies only), browser `localStorage` for transcript truth.

---

## Domain Language (mandatory)

| UI label (ok) | Code / API / DB |
| --- | --- |
| "Session history" (nav copy) | `Conversation` |
| "Message" (bubble) | `Turn` (one user question + one assistant attempt) |
| "Project" | **Knowledge Domain** (`domainId` on turn, not on conversation) |

A **Conversation** has many **Turns**. Each Turn optionally records one **Knowledge Domain** for `domain_rag` or none for `direct_llm`. Switching domain on a new Turn does not rewrite prior Turns.

---

## Approved Data Model (DATA-001 P7)

### `conversations`

| Field | Rule |
| --- | --- |
| `id` | Opaque PK |
| `owner_user_id` | FK → `users.id`; **every query filters this** |
| `title` | Nullable safe label; no prompts/source text |
| `created_at`, `updated_at` | Service timestamps; `updated_at` bumps on new/finished Turn |

### `conversation_turns`

| Field | Rule |
| --- | --- |
| `id` | Opaque PK |
| `conversation_id` | FK CASCADE |
| `client_request_id` | Idempotency key; unique per conversation |
| `domain_id` | Nullable; required iff `route = domain_rag` |
| `route` | `direct_llm` \| `domain_rag` (server-assigned) |
| `status` | `running` \| `completed` \| `failed` \| `redacted` |
| `user_message` | Retained after redaction |
| `assistant_answer` | Cleared on redaction |
| `stop_reason`, safe errors, counters | Per DATA-001 |

**No separate `messages` table.** Thread UI maps Turn rows → user bubble + assistant bubble.

### `conversation_turn_evidence_refs`

Turn-scoped citations only. Private `source_document_id` / `source_block_id` never returned to browser.

### Proposed quota extension

| Field | Rule |
| --- | --- |
| `users.conversation_storage_bytes` | Denormalized sum of owned conversation text bytes |
| Cap | `524_288_000` (500 MiB) UTF-8 byte count |

Count formula per Turn (on finalize + on delete subtract):

```text
turn_bytes =
  byte_len(user_message)
  + byte_len(assistant_answer or '')
  + sum(byte_len(excerpt) for evidence refs)
```

---

## Approved API Surface (API-001 P7 + proposed patches)

### Existing (approved)

```http
GET    /api/v1/conversations
POST   /api/v1/conversations
GET    /api/v1/conversations/{conversation_id}
DELETE /api/v1/conversations/{conversation_id}
POST   /api/v1/conversations/{conversation_id}/turns:stream   # SSE
```

### Proposed for session-history UX (patch API-001 before implement)

```http
GET    /api/v1/conversations?limit=40&cursor={opaque}
PATCH  /api/v1/conversations/{conversation_id}   # body: { "title": "..." }
```

### List response (proposed)

```json
{
  "conversations": [{
    "id": "conv_01",
    "title": "Startup sequence question",
    "createdAt": "2026-07-02T12:00:00Z",
    "updatedAt": "2026-07-02T12:05:00Z",
    "turnCount": 4,
    "lastTurnAt": "2026-07-02T12:05:00Z",
    "activeTurnStatus": "idle"
  }],
  "nextCursor": "opaque-or-null"
}
```

`activeTurnStatus`: `idle` \| `running` \| `failed` — derived from partial unique running Turn constraint.

### Detail response

Per reconciled design gates (A1): conversation metadata + `turns[]` with safe summaries, evidence arrays, redacted shapes.

### Auth rules

- Member + Administrator: **own conversations only**
- Other user's id → **404** (not 403)
- No admin global chat read in P7

---

## Storage & Retention

| Concern | Owner | Rule |
| --- | --- | --- |
| Transcript text | Postgres | Confidential; owner-scoped |
| Evidence excerpts | `conversation_turn_evidence_refs` | Max 500 chars each (P6 bound) |
| Files / attachments | **Out of scope** | No user uploads in conversation history v1 |
| Browser cache | TanStack Query | Invalidate on turn complete; not source of truth |
| localStorage | UI prefs only | Sidebar width, palette open — **never** transcript |
| Source/domain delete | Redaction service | Clears derived answer + evidence; keeps `user_message` |

**500 MiB workspace** = per-user cap on persisted conversation **text** in Postgres, not disk quota for Source Documents or LightRAG.

---

## Flows

### List / open history

```text
User → GET /conversations (cursor)
     → pick row → navigate /chat/{conversationId}
     → GET /conversations/{id} → render turns (read-only except new send)
```

### New conversation

```text
User → POST /conversations {} 
     → navigate /chat/{id}
     → composer send → POST .../turns:stream
```

### Live + history (no LS filesystem merge)

```text
Running turn: activeTurnStatus=running on list + disable duplicate send (409)
Complete: invalidate conversation list + detail queries
Multi-tab: stale-stream guard on clientRequestId + turn id (F-009 shell)
```

---

## Do-Not-Copy List (from brainstorm)

| Reference file | Why forbidden |
| --- | --- |
| LS `sessions-store.ts` | Scans Pi JSONL on disk |
| LS `session-metadata-store.ts` | Local JSON archive file |
| LS `workspace/store.ts` | localStorage session authority |
| LS `app/api/agent/sessions/*` | User-supplied `cwd`, raw events |
| localGPT `backend/database.py` | SQLite, no auth, session-scoped RAG indexes |
| localGPT session uploads/index link | CE domains are admin-curated, not per-chat |

---

## Dependencies

| Phase | Provides |
| --- | --- |
| P1 | Auth cookie, `/auth/me`, owner identity |
| P7 F-007 | Tables, turn stream, redaction |
| P9 F-009 | Chat shell, slices 11–12 |
| This feature | List/history UX + quota on top of F-007 data plane |

---

## Verification Checklist

- [ ] Other user's conversation returns 404
- [ ] List is cursor-paginated; no 90-day client-side aggregate fetch
- [ ] Quota reject before persist; safe error code; no partial turn orphan
- [ ] Reload `/chat/{id}` restores full authorized thread
- [ ] Redacted turns render per contract (question only)
- [ ] No path/cwd/provider payload in list or detail DTOs
- [ ] OpenAPI snapshot updated after contract patch
