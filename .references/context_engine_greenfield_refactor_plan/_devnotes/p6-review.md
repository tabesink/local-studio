# P6 Review

## Why is card count capped at 8?

Plan never states why 8. Not a browser-perf cap — it's a bounded server payload + P7 synthesis prep + UX scan limit.

### What the numbers mean

| Constant | Value | Role |
| --- | --- | --- |
| `RAW_HIT_LIMIT` | 12 | LightRAG fetch |
| `EVIDENCE_LIMIT` | 8 | After map + dedupe, return to client |
| `EXCERPT_MAX` | 1_200 | Per card |

Worst case one response ≈ 8 × 1.2k chars excerpt + labels ≈ ~10k text. Tiny JSON. 8 DOM cards = negligible client cost.

### Likely reasons (inferred, not spelled in doc)

- **P7 bound** — evidence → "bounded synthesis context" for LLM. 8 blocks × 1.2k chars = predictable token budget downstream.
- **Signal over noise** — LightRAG returns 12 raw hits; mapper dedupes by block; cap 8 = top relevant chunks, not wall of cards.
- **Server cost** — less map/validate work, smaller response, faster LightRAG round-trip. Not DB (P6 stores nothing).
- **Fixed policy** — server constants only. No browser topK, no domain config, no feature flag. Low entropy.
- **Not primary driver:** client render perf.

### Chat chain / accumulation?

P6 = no chat. Spec says:

- No chat history
- No query history
- State: `selectedDomainId`, `typedQuestion`, `evidenceResult` — memory only
- Reload → clear
- Each submit → replace `evidenceResult`. No stack of past 8-card sets unless someone builds chat UI outside P6 scope.

Hypothetical P7 chat with history: yes, N turns × 8 cards could grow DOM/memory — but that's a P7 problem. P6 design avoids it entirely.

---

## Product scale correction (README DNA)

Context Engine targets a **private trusted team of ~5–10 concurrent users**, not single-user and not Slack-scale.

From README product principles:

| Principle | Chat/history implication |
| --- | --- |
| **Evidence before eloquence** | Model context = current evidence + short recent dialogue. Old evidence collapsed, not re-sent every turn. |
| **Inspectable answers** | Users must revisit answer → evidence → source within a session (and ideally after refresh). Pushes toward **some persistence** in P7+, not ephemeral-only. |
| **Curated knowledge** | Conversations scoped to **domain**, not one global firehose. |
| **Lean deployment** | Small team, private deploy. Postgres rows for threads OK. No Cassandra/Redis/Elasticsearch chat infra. |
| **Clear admin control** | Admin owns domains/docs/indexing — not chat ops at Slack scale. |

### Concurrency ≠ chat persistence

```text
10 users × POST /evidence at same time
  → stateless read-only retrieval
  → auth + domain eligibility + LightRAG call
  → no shared chat state, no write conflicts
```

Concurrent load stresses **server/API/LightRAG capacity**, not chat-history architecture. P6 handles that with normal auth, pooling, and timeouts.

**Slack-scale pagination** (millions of msgs, deep scroll-back, channel fan-out, write-heavy realtime) is still out of scope.

**Team-appropriate persistence** (per-user, domain-scoped, capped threads in Postgres) fits product DNA and stays lean.

---

## DOM / memory growth concern

Production apps split the problem in two layers. Different fixes.

### Layer 1: Model context (real bottleneck)

N turns × 8 evidence cards = token bomb for LLM, not browser. Each turn resends history (or summary) + new retrieval.

| App | Strategy |
| --- | --- |
| **Cursor** | Auto `/summarize` near limit. Conversation ~190k → ~1k tokens. Manual summarize ~70–80%. New chat per feature. `@Files` not full history. Cursor forum, docs pattern |
| **Claude Code** | Microcompaction — drop bulky tool outputs early. Auto-compact ~13k tokens before window cap. Structured summary (intent, decisions, todos). Keep recent turns verbatim. Re-read last ~5 files after compact. Manual `/compact`. Deep dive |
| **ChatGPT / OpenAI API** | Default = truncate oldest from model view. Full thread still stored. No auto summarization in API — dev builds it. `truncation: "auto"` safety net. OpenAI community |
| **Claude API** | Context editing — server clears old tool results / thinking blocks before prompt. Client keeps full history locally. Anthropic docs |
| **Agent platforms (Manus etc.)** | Aggressive tool-output pruning. Phase-boundary summarization. Big results → external store, not active context |

**Pattern:** never ship full N-turn raw evidence to model every time.

Typical stack:

- Keep last K turns verbatim
- Summarize older turns
- Drop/collapse tool/evidence payloads after use
- External memory (files, RAG, DB) for stuff not in window

### Layer 2: Browser DOM (secondary)

8 cards × N turns = hundreds of DOM nodes. Annoying, not fatal. Production chat UIs don't render all.

| Technique | What |
| --- | --- |
| **Virtualization** | Render visible rows only. TanStack Virtual `anchorTo: 'end'` for chat prepend/stream. TanStack chat guide |
| **Cursor pagination** | Load older msgs on scroll-up. `before=messageId&limit=50`. Not offset. Stream architecture |
| **Collapse old evidence** | Show "8 sources" chip. Expand on click. Old turns = summary line, not 8 full cards |
| **Replace not append** | Some UIs only show current retrieval; prior evidence lives in collapsed turn |

Browser perf rarely drives cap. Token budget + UX scanability drive cap.

### Map to your P6/P7 question

**P6:** no chat → no accumulation. Each query replaces `evidenceResult`. Problem deferred on purpose.

**P7 chat would need (prod pattern):**

Per turn:

- retrieve fresh 8 cards (server cap stays)
- send to LLM: current evidence + compact prior turns — NOT all old cards verbatim

UI:

- collapse old evidence ("8 sources")
- current turn: full cards visible
- virtualized message list only if >~50 visible turns

Context:

- truncate oldest turns (drop, not summarize, for v1)
- keep last 1–2 turns + current evidence full for LLM
- drop raw LightRAG hits after map (already P6 rule)

Persistence (P7+, team-sized):

- per user (+ optional per domain): persist current conversation thread
- cap stored turns (e.g. 20–50); truncate overflow, no infinite archive
- reload restores last active thread — supports "inspectable answers" after refresh
- store excerpt + sourceLabel + server-side block ref for evidence revisit

8-card cap aligns with prod: bounded retrieval per turn + bounded synthesis input. Chat history handled separately via truncate/collapse — not by stacking unlimited cards or Slack-scale pagination.

### Takeaway

Prod apps don't let N × 8 cards grow unbounded in model context or UI.

- **Model side:** truncate, collapse evidence in old turns
- **UI side:** collapse old evidence; virtualize only when needed
- **Product side (5–10 users):** capped server persistence for inspectability; new chat to reset

P6 "no history" = correct for evidence-only slice. P7 adds team-appropriate persistence, not Slack infra.

---

## Recommended stack (smallest diff)

### Per turn

- fresh retrieve → max 8 cards (keep P6 cap)
- LLM gets: question + current 8 excerpts + last 2 answer texts only
- old evidence → never resend to model

### UI

- chat thread = Q + answer bubbles
- old turns: collapse evidence → "8 sources" expand-on-click
- current turn: full cards visible

### Session

- **P6:** memory only, reload clears (evidence-only slice — correct as spec'd)
- **P7+:** persist current thread per user (optionally per domain); reload restores
- "New chat" button clears thread and starts fresh persisted conversation

### Context overflow

- drop oldest turns (truncate)
- no `/compact`, no LLM summary, no external store for v1

### Why this beats others

| Approach | Verdict |
| --- | --- |
| Truncate oldest turns | Leanest model-side fix. OpenAI default. Zero extra infra. |
| Collapse old evidence UI | Fixes DOM without TanStack Virtual. |
| Fresh retrieval per turn | Already your design. Old cards = display artifact, not context payload. |
| Capped server persistence (P7+) | Fits 5–10 user workspace + "inspectable answers". Postgres rows, not Slack infra. |
| New chat button | Cursor pattern. Cheaper than auto-compact. |
| LLM `/compact` summarization | Heavy. Needs summary prompt, quality tuning, failure handling. Defer. |
| Microcompaction + rehydrate | Claude Code-grade. Overkill for v1. |
| Virtualization | Only when >~50 turns visible. Premature before that. |
| Slack-scale pagination + infinite archive | Wrong scale. Deep cursor pagination through years of msgs not needed for 5–10 users. |

### What NOT to build v1

- Auto-compact at 70% window
- Summarize-old-turns LLM call
- Virtual scroll (until turn count proves need)
- Context editing API integration
- Slack-scale message stores, search indexes, or deep history pagination

**Defer, don't skip forever:** minimal conversation + turn persistence in P7 when chat ships — required for inspectability across refresh, still lean for team size.

Add compaction/virtualization only when users hit real limits (long sessions, slow UI, bad answers from lost context).

### One-line rules

- **P6:** Model sees current evidence only. UI replaces result each query. Session ephemeral. Correct for this slice.
- **P7+:** Model sees current evidence + short recent dialogue. UI collapses old evidence. Capped server persistence per user/domain. Truncate when full.

Matches P6 low-entropy spirit. Smallest path to a team workspace that honors README product DNA.

---

## Minimal persistence schema (P7+ sketch)

**Scope:** P7+ chat with synthesis. **Not P6** — P6 stays request-scoped, no tables.

Sized for ~5–10 users. Postgres only. No search index, no message queue, no deep pagination.

### Design choices

| Choice | Rationale |
| --- | --- |
| One thread per user + domain | Matches curated knowledge; avoids global inbox |
| Turn = one Q→A exchange | Simple cap unit ("20–50 turns" = 20–50 questions) |
| Denormalized evidence snapshots | Source blocks change on re-ingest; user sees what they saw at query time |
| `source_block_id` server-only | Inspectability + future source nav; never in browser DTO (P6 rule carries forward) |
| Truncate oldest on cap | No archive pagination; drop overflow rows |
| No separate citation table | Evidence refs on turn suffice for v1 |

### Entity relationship

```text
users (P1)
  └── conversations (1 active per user+domain, or many with "new chat")
        └── turns (ordered exchanges, capped e.g. 50)
              └── turn_evidence_refs (0–8 per turn, ordered)
                    └── source_blocks (P4 FK, server-side only)
```

### Tables

```sql
-- One chat thread. Scoped to authenticated member + domain.
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_id       UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    title           TEXT,                    -- optional; e.g. first question snippet
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'archived')),
    turn_count      INT NOT NULL DEFAULT 0,  -- denormalized for cap enforcement
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_turn_at    TIMESTAMPTZ
);

CREATE INDEX ix_conversations_user_domain_updated
    ON conversations (user_id, domain_id, updated_at DESC);

CREATE INDEX ix_conversations_user_updated
    ON conversations (user_id, updated_at DESC);


-- One row = one member question + assistant answer (P7).
CREATE TABLE turns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    ordinal         INT NOT NULL,            -- 1..N within conversation
    question        TEXT NOT NULL,           -- member input (max 4000 enforced in app)
    answer          TEXT,                    -- P7 synthesis output; NULL in evidence-only probe
    result_kind     TEXT NOT NULL
                    CHECK (result_kind IN (
                        'evidence', 'no_grounded_context', 'retrieval_unavailable'
                    )),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (conversation_id, ordinal)
);

CREATE INDEX ix_turns_conversation_ordinal
    ON turns (conversation_id, ordinal);


-- Mapped evidence snapshot for a turn. Max 8 rows per turn (app-enforced).
-- Private FK columns: never exposed in member API response.
CREATE TABLE turn_evidence_refs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turn_id         UUID NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
    ordinal         INT NOT NULL,            -- 1..8, LightRAG order preserved
    excerpt         TEXT NOT NULL,           -- canonical block excerpt (max 1200)
    source_label    TEXT NOT NULL,           -- safe label shown in UI
    source_id       UUID NOT NULL REFERENCES source_documents(id),
    source_block_id UUID NOT NULL REFERENCES source_blocks(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (turn_id, ordinal),
    UNIQUE (turn_id, source_block_id)        -- dedupe same block in one turn
);

CREATE INDEX ix_turn_evidence_refs_turn_ordinal
    ON turn_evidence_refs (turn_id, ordinal);
```

### Constants (align with P6)

```python
MAX_TURNS_PER_CONVERSATION = 50
MAX_EVIDENCE_REFS_PER_TURN = 8      # same as EVIDENCE_LIMIT
MAX_EXCERPT_CHARS = 1_200
MAX_QUESTION_CHARS = 4_000
MAX_ACTIVE_CONVERSATIONS_LIST = 20  # sidebar recent threads
```

### Cap enforcement (app layer)

```text
On new turn insert:
  1. Verify conversation.user_id == current user
  2. Verify domain access + query eligibility (reuse P5/P6)
  3. If turn_count >= MAX_TURNS_PER_CONVERSATION:
       DELETE oldest turn (CASCADE drops evidence_refs)
       renumber ordinals OR leave gaps (gaps OK, simpler)
  4. Run P6 query_evidence() → map hits
  5. INSERT turn + turn_evidence_refs (denormalized snapshots)
  6. P7: run synthesis using current evidence + last 2 answer texts
  7. UPDATE conversation.turn_count, last_turn_at, updated_at
```

No background job. No trigger complexity for v1.

### Member API shape (sketch)

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/domains/{domain_id}/conversations` | List recent threads for current user (limit 20) |
| `POST` | `/api/v1/domains/{domain_id}/conversations` | New chat ("New chat" button) |
| `GET` | `/api/v1/conversations/{id}/turns` | Load full capped thread |
| `POST` | `/api/v1/conversations/{id}/turns` | Ask question; retrieve + persist + synthesize |

**Browser DTO for evidence (same safety as P6):**

```json
{
  "turnId": "…",
  "ordinal": 3,
  "question": "What inspection interval applies?",
  "answer": "Inspection required after every 50,000 cycles.",
  "resultKind": "evidence",
  "evidence": [
    {
      "evidenceId": "e1",
      "excerpt": "Inspection required after every 50,000 cycles.",
      "sourceLabel": "Fatigue Manual · Fatigue Test 3 · Page 12"
    }
  ]
}
```

Never return `sourceId`, `sourceBlockId`, `sourcePath`, LightRAG IDs.

### What this schema deliberately omits

```text
No message_search / full-text index
No cursor pagination for ancient history
No shared/collaborative threads (single-user ownership)
No evidence table separate from turns
No query_history / audit log table (use app logs)
No soft-delete on turns (hard delete on truncate is fine)
No multi-tenant ACL beyond user owns conversation
```

Add only if team outgrows: conversation search, export, admin audit, shared threads.

### Rough size at 5–10 users

```text
10 users × 3 domains × 1 active conversation × 50 turns × 8 refs
  ≈ 12k turn_evidence_ref rows peak (if everyone maxes out)
  ≈ trivial for Postgres
```

Most real usage far smaller. No sharding, no cache layer needed.

