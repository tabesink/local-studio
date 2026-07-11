# Context Engine — Session History + RAG Pipeline Scaffold (INCOMPLETE)

**Status:** braindump consolidation from grill-with-docs session  
**Date:** 2026-07-03  
**Authority:** advisory until patched into active specs/contracts  
**Finish later:** open decisions, contract patches, feature spec creation

---

## Executive Summary

Adapt `.devnotes/features/` braindump into Context Engine as a **lean LightRAG-shaped app** with:

- User chat / session history (Postgres-backed)
- Conversational history in response synthesis (session-scoped, DB-authoritative)
- Basic RAG (LightRAG naive equivalent) + Advanced agentic RAG (controllable loop)
- Local Studio UI/UX parity deferred to F-010 / F-009 slices

**Feature split (confirmed):**

| Feature | Scope |
| --- | --- |
| **F-007** | Durable sessions/messages + turn stream + IntentGate + orchestrator (basic + advanced) + redaction |
| **F-010** | History UX on top — list/cursor/quota/rename/resume/command palette — no new persistence concepts |

---

## Locked Decisions

| Decision | Choice |
| --- | --- |
| Data model | `chat_sessions` + `chat_messages` tables (not `conversation_turns` as UI unit) |
| Turn grouping | `turn_id` on messages groups user+assistant pair; idempotency + evidence refs stay turn-scoped |
| History authority | **A — DB-authoritative** (lean): server builds synthesis history from DB; browser `history[]` optional bootstrap only on first turn |
| History scope | **Session-scoped only** — prior messages in current `chat_session` only; never cross-session or cross-user |
| Synthesis history roles | user + assistant prior turns (LightRAG `conversation_history` pattern) |
| Retrieval input | **Current message only** — history is LLM-only, does not affect retrieval query |
| No evidence | Skip LLM → `no_grounded_context` terminal + server-owned safe user text (LightRAG `fail_response` pattern) |
| Classifier | **IntentGate** upstream of both basic and advanced RAG; tier-1 keywords, tier-2 LLM fallback |
| RAG default | `basic` mode (1× retrieve) ships first; `advanced` behind server flag |
| Product terms vs tables | DB: `chat_sessions`/`chat_messages`; product/docs: **Conversation**/**Turn** (Option 1) |

---

## Contradictions to Resolve in Docs

```text
CONFLICT A — session-history-brainstorm.md
  proposes: ChatSession + ChatMessage, /api/chat-sessions
  CE truth (updated): chat_sessions + chat_messages, /api/v1/conversations paths
  → Mark brainstorm as UX reference; sesson_history_recs needs Turn→Message split update

CONFLICT B — lightrag-ce-direct-rag-response.md
  proposes: browser-supplied transient history, no persistent tables (§2)
  CE truth (updated): Postgres messages + DB-authoritative history for synthesis
  → Rewrite persistence section; keep LightRAG retrieval/synthesis split

CONFLICT C — advanced_rag_pipeline/README.md ~line 290
  rejects: "General/domainless chat branch"
  F-007 spec: direct_llm IS in scope
  → Fix README; direct LLM stays, browser never selects route

CONFLICT D — AI-001 (approved)
  says: "No prior assistant answers in the prompt"; "bounded prior user questions only"
  updated direction: allow user+assistant history in domain RAG synthesis (LightRAG aligned)
  → Patch AI-001
```

---

## Data Model

### `chat_sessions`

| Field | Rule |
| --- | --- |
| `id` | Opaque PK |
| `owner_user_id` | FK → `users.id`; every query filters this |
| `title` | Nullable safe label |
| `created_at`, `updated_at` | Service timestamps; `updated_at` bumps on new/finished turn |

### `chat_messages`

| Field | Rule |
| --- | --- |
| `id` | Opaque PK |
| `session_id` | FK → `chat_sessions.id` CASCADE |
| `turn_id` | Groups user + assistant pair (idempotency, evidence refs) |
| `role` | `user` \| `assistant` |
| `content` | User-visible text |
| `status` | `complete` \| `streaming` \| `failed` \| `redacted` |
| `domain_id` | Nullable; on turn group or user message |
| `route` | `direct_llm` \| `domain_rag` (server-assigned via IntentGate) |
| `client_request_id` | Idempotency key (user message only); unique per session |
| `created_at`, `completed_at` | Timestamps |

### `conversation_turn_evidence_refs` (unchanged concept)

Turn-scoped citations. Private `source_document_id` / `source_block_id` never returned to browser.

### UI mapping

```text
session → messages ordered by created_at
turn_id groups: [user bubble] [assistant bubble]
```

### Proposed quota (F-010)

| Field | Rule |
| --- | --- |
| `users.conversation_storage_bytes` | Denormalized sum per owner |
| Cap | 524_288_000 (500 MiB) UTF-8 bytes |

Count: `user_message + assistant_answer + evidence excerpt bytes` per turn.

---

## Layer Boundaries

```text
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER (F-009 / F-010)                                          │
│  features/conversations/  — list, command palette, API wrappers  │
│  features/chat/           — thread render, composer, SSE shell   │
│  SENDS: message, optional domainId, clientRequestId              │
│  NEVER: history[] required, LightRAG, paths, model, route        │
└────────────────────────────┬────────────────────────────────────┘
                             │ HttpOnly cookie session
                             │ GET/POST/PATCH/DELETE /api/v1/conversations*
                             │ POST .../turns:stream (SSE)
┌────────────────────────────▼────────────────────────────────────┐
│ API ROUTES (context_engine/api/)                                 │
│  Auth → owner_user_id filter → 404 if not owner                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ ChatTurnService + IntentGate + TurnOrchestrator (F-007)          │
│  CRUD, cursor list, quota, idempotency, one-running guard         │
│  DB history → synthesis; redaction hooks                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ Postgres (system of record)                                      │
│  chat_sessions | chat_messages | turn_evidence_refs              │
└──────────────────────────────────────────────────────────────────┘
```

**Not in boundary:** Source Document files, LightRAG runtime (private), auth_sessions, browser localStorage for transcript truth.

---

## End-to-End Turn Pipeline

```text
POST /conversations/{id}/turns:stream
  { message, domainId?, clientRequestId, history?[] }
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ 1. AUTH + owner check + idempotency + 409 guard           │
│ 2. Persist user ChatMessage                               │
│ 3. Build synthesis history FROM DB (ignore browser[])     │
│    └─ session-scoped only; last N turns; byte cap         │
└───────────────────────────┬───────────────────────────────┘
                            ▼
┌───────────────────────────────────────────────────────────┐
│ 4. IntentGate                                             │
│    inputs: message + DB history + domainId?               │
│             + domain source filenames (if domainId set)     │
│    tier-1: keywords (deterministic)                       │
│    tier-2: LLM classify (only if inconclusive)            │
└───────────────┬─────────────────────┬─────────────────────┘
                │                     │
         direct_llm            domain_rag
                │                     │
                ▼                     ▼
    synthesis(history,          TurnOrchestrator
     no evidence)               basic | advanced
                │                     │
                │              retrieve(current msg ONLY)
                │              evidence==0 → no_grounded_context
                │              else → synthesize(history+evidence)
                │                     │
                └──────────┬──────────┘
                           ▼
              persist assistant ChatMessage + SSE done
```

---

## History Authority (A — DB-authoritative, lean)

```text
Browser                          Server
────────                         ──────
GET /conversations/{id}
  ← messages[]                   DB source of truth

POST turn
  history[] optional         →   IGNORE if session has messages
                                 BUILD from DB only

First turn in new session:
  history[] may bootstrap      VALIDATE shape only, then discard
```

**Session scope:**

```text
chat_session A                    chat_session B
├─ msg 1 user                     ├─ msg 1 user
├─ msg 2 assistant                └─ ...
├─ msg 3 user
└─ msg 4 assistant  ◄── current turn

Synthesis history for turn in session A:
  WHERE session_id = A AND id != current_user_message
  ORDER BY created_at LIMIT last N

NEVER: other sessions, other users, prior-turn evidence in prompt
```

**LightRAG rule preserved:**

```text
CURRENT USER MESSAGE ──► retrieval
conversation_history ──► final LLM only (user+assistant roles)
```

---

## IntentGate (Classifier Layer)

Sits **upstream** of both basic and advanced RAG. Browser never selects route.

```text
IntentGate.classify(ctx):
  ctx = {
    message,
    history[],           # from DB, sanitized
    domainId?,           # composer selection
    domainSourceLabels[] # safe filenames/titles for domainId
  }

  tier-1 KEYWORDS (no LLM):
    "hello", "rewrite", "thanks" → direct_llm
    message mentions doc filename/title → domain_rag
    domain keyword hit → domain_rag

  tier-2 LLM (inconclusive only):
    inputs: message, last N history, domainSourceLabels
    output: direct_llm | domain_rag (closed enum)

  fail closed:
    needs domain but no domainId → NEED_DOMAIN error (see open Q3)
```

**Filename source:** `source_documents` safe label / original filename for selected domain — never paths.

```text
domainSourceLabels example:
  ["Startup Manual v2.pdf", "Acceptance Test Procedure", "ECU Wiring Guide"]
```

---

## Basic vs Advanced RAG

Same `TurnOrchestrator` module; mode from server policy flag.

```text
TurnOrchestrator.run(state):

  if policy.rag_mode == "basic":        ← pilot default (LightRAG naive)
      1× retrieve(overview, current_msg)
      evidence==0 → no_grounded_context (no LLM)
      else → synthesize(history + evidence)

  if policy.rag_mode == "advanced":     ← flag-gated post-pilot
      plan → loop → replan → final answer
```

### Advanced loop

```text
INPUTS: domain_id, question, db_history[], policy budgets

START
  │
  ▼
[plan]  max 5 steps          SSE: stage=planning
  │
  ▼
┌── for each step (budgeted) ──────────────────────────────┐
│  router → retrieve_fact | retrieve_overview |            │
│           retrieve_verbatim | answer_from_evidence       │
│                                                          │
│  if retrieve_*:                                          │
│    SSE: retrieving → RetrievalPort → verifier          │
│    SSE: evidence (batch append)                          │
│                                                          │
│  if answer_from_evidence:                                │
│    derived fact (internal, not sent to client)           │
│                                                          │
│  SSE: verifying                                          │
│  if answerable: BREAK else replanner.trim                │
└──────────────────────────────────────────────────────────┘
  │
  ▼
if evidence empty → no_grounded_context (NO LLM)
  │
  ▼
[final answer]  SSE: answering → token stream
[citation validate] → repair_once → done | insufficiency
END
```

### Budgets (`chat/policy.py`)

```text
MAX_PLAN_STEPS               = 5
MAX_RETRIEVAL_OPS            = 3
MAX_REPAIR_ATTEMPTS          = 1
MAX_FINAL_ANSWER_RETRIES     = 1
TURN_TIMEOUT_SECONDS         = 90
HISTORY_MAX_TURNS            = N   (TBD)
HISTORY_MAX_BYTES            = M   (TBD)
```

---

## RetrievalPort (one physical path)

```text
TurnOrchestrator
      │ retrieve(domain, query, intent)
      ▼
F-006 evidence callable (= POST /domains/{id}/evidence)
      │
      ├─ private LightRAG retrieve (naive/vector)
      ├─ CE_BLOCK parser
      ├─ source_is_query_eligible()
      └─ return Evidence[] (safe DTO)

Intents (server-owned, not separate retrievers):
  fact      → narrow query
  overview  → default (basic mode)
  verbatim  → quote/excerpt bias
```

**Rejected:** second vector store, LangGraph, Redis/Celery, browser retrieval controls, raw plan text in SSE/DB.

---

## Backend Module Tree

```text
context_engine/chat/
  service.py           ChatTurnService — txn order, no DB inside loop
  intent_gate.py       tier-1 keywords + tier-2 LLM + filename hints
  orchestrator.py      basic + advanced while-loop
  planning.py          PlannerPort, Replanner (advanced only)
  routing.py           closed op enum
  policy.py            budgets, rag_mode, timeouts
  events.py            internal progress → EVT-001 SSE
  contracts.py         TurnState, TurnOutcome, safe DTOs

context_engine/evidence/
  retrieval.py         RetrievalPort → F-006 (ONLY LightRAG entry)
  verifier.py          distill + verify_once

context_engine/providers/
  synthesis_gateway.py stream adapter (F-002 profile)

Import rule:
  api → chat → evidence/providers   OK
  evidence → chat                   FORBIDDEN
```

---

## No-Context Behavior (LightRAG → CE)

LightRAG reference (`vendor/lightrag/prompt.py`, `operate.py`):

```text
naive_query: chunks empty → return None (no LLM)
fail_response: "Sorry, I'm not able to provide an answer...[no-context]"

naive_rag_response prompt (when LLM IS called):
  "If answer cannot be found in Context, state insufficient information"
```

CE mapping:

```text
Retrieval → 0 mapped Evidence:
  stop_reason = no_grounded_context
  SSE: evidence=[] → done (no token stream)
  User text: server template (not LLM):
    "I don't have enough information in this Knowledge Domain..."

Retrieval → some Evidence but can't answer:
  LightRAG insufficiency prompt rule + citation validator repair
```

---

## Synthesis Prompt (domain RAG)

Adapt LightRAG `naive_rag_response` (~prompt.py:278-300):

```text
system:  role + grounding rules
context: mapped Evidence excerpts only (current turn accumulated)
history: prior user+assistant turns (DB, session-scoped)
query:   current message
```

Direct LLM: history only, no evidence, no citations.

---

## SSE Contract

```text
Internal progress          →  Public SSE
─────────────────             ──────────
planning                   →  stage: planning
retrieving                 →  stage: retrieving
evidence batch             →  evidence: { items[] }
answering / token          →  token: { text }
terminal ok                →  done: { citations, stopReason }
terminal fail              →  error: { safeCode, safeMessage }

NEVER: plan text, chain-of-thought, raw LightRAG hits, prompts
```

Basic: one `evidence` event. Advanced: multiple (one per retrieval op).

---

## Failure Terminals

| Condition | Terminal | LLM called? |
| --- | --- | --- |
| Zero evidence (any mode) | `no_grounded_context` | NO |
| Budget exhausted | `turn_budget_exhausted` | maybe partial |
| Provider fail after evidence | `evidence_only` | NO |
| Citation fail after repair | `insufficiency` | had stream |
| Direct LLM provider fail | safe error | partial ok |

---

## API Seams (paths may stay `/conversations`)

```http
GET    /api/v1/conversations?cursor=&limit=40
POST   /api/v1/conversations
GET    /api/v1/conversations/{id}          → { conversation, messages[] }
PATCH  /api/v1/conversations/{id}        → { title }  (F-010)
DELETE /api/v1/conversations/{id}
POST   /api/v1/conversations/{id}/turns:stream
```

Turn request body:

```json
{
  "clientRequestId": "...",
  "message": "...",
  "domainId": "optional",
  "history": []
}
```

`history[]` optional — DB wins after first persist.

Forbidden: `route`, `model`, `provider`, `topK`, `retrievalMode`, etc. → 422.

---

## Frontend ↔ Backend Seams (deferred UI detail)

| Module | API | Invalidation |
| --- | --- | --- |
| `conversations/api.ts` | CRUD + list | turn done, delete, rename |
| `chat/use-turn-stream.ts` | POST turns:stream SSE | on done/error |
| `chat/use-conversation-detail.ts` | GET detail | after stream |
| Route | `/chat/[conversationId]` | — |

Nav: CE icon rail (Chat → Documents → Graph → Settings). Session list inside chat feature.

---

## Build Order (vertical slices)

```text
CE-0  P6 evidence callable                           [F-006]
CE-1  chat_sessions + chat_messages schema + CRUD    [F-007]
CE-2  IntentGate + direct_llm path                   [F-007]
CE-3  Basic RAG (orchestrator mode=basic)            [F-007]
CE-4  SSE stage + citation validator                  [F-007]
CE-5  Advanced orchestrator (flag-gated)               [F-007 / F-007.1]
CE-6  Redaction hooks                                [F-007]
CE-7  F-010: list cursor, quota, PATCH, resume UX
CE-8  Tests: owner isolation, quota, no_grounded_context, stale-stream
```

**Gate:** CE-0 / CE-5 blocked until P6 proves CE_BLOCK + eligibility.

---

## Contract Patch Checklist

```text
MUST REWRITE
  specs/03-contracts/data/context-engine-data.md
  specs/03-contracts/ai/grounded-answering.md
  specs/03-contracts/api/context-engine-v1.md
  specs/04-features/F-007-grounded-streaming-chat/spec.md

NEW
  specs/04-features/F-010-conversation-history/spec.md
  specs/04-features/F-010-conversation-history/plan.md

DEPRECATE / ADD BANNERS
  .devnotes/features/session-history-brainstorm.md
  .devnotes/features/lightrag-ce-direct-rag-response.md (persistence §)
  .devnotes/features/advanced_rag_pipeline/README.md (direct_llm line)
  .devnotes/features/sesson_history_recs/00-boundaries-*.md (Turn→Message)
```

---

## Open Decisions (TODO — finish later)

### Q3 — Missing domainId when message is domain-specific

| Option | Behavior |
| --- | --- |
| **A** Fail closed | Return "Select a Knowledge Domain." User picks in composer. |
| **B** Auto-match | Scan filenames across all available domains; auto-pick; proceed. |
| **C** Hybrid (recommended) | No domainId + direct keywords → direct_llm. Domain-specific signal → error with suggested domain name. domainId present → classify direct vs rag within that domain. |

**Decision:** _TBD_

### Other TBD

- [ ] `HISTORY_MAX_TURNS` and `HISTORY_MAX_BYTES` values
- [ ] Exact no_grounded_context user-facing template text
- [ ] Archive/restore vs hard DELETE (brainstorm UX deferred)
- [ ] LLM-generated conversation titles (defer; truncate first message in UI)
- [ ] Admin read other users' history (out of scope P7)
- [ ] Whether `stage` SSE is pilot-required or post-pilot
- [ ] Glossary: keep Conversation/Turn in docs vs rename to match tables
- [ ] Exact tier-1 keyword fixture table for IntentGate
- [ ] Tier-2 LLM classifier prompt + fixture set

---

## Source References

| Doc | Use |
| --- | --- |
| `.devnotes/features/index.md` | Feature index |
| `.devnotes/features/session-history-brainstorm.md` | Local Studio UX verdict (paths/API superseded) |
| `.devnotes/features/sesson_history_recs/` | Boundaries, backend, frontend, wiring plans |
| `.devnotes/features/advanced_rag_pipeline/` | Orchestrator sequence, module map |
| `.devnotes/features/lightrag-ce-direct-rag-response.md` | LightRAG naive split, history placement, prompts |
| `.devnotes/P6-post-impl-REVIEW/F-007-P7-reconciled-design-gates.md` | P7 design gates |
| `.devnotes/P6-post-impl-REVIEW/ID-A-direct-llm-intent-gate.md` | Intent gate rules |
| `specs/04-features/F-007-grounded-streaming-chat/spec.md` | Approved F-007 (needs patch for messages model) |
| `specs/03-contracts/ai/grounded-answering.md` | AI-001 (needs history policy patch) |
| `vendor/lightrag/prompt.py` | `fail_response`, `naive_rag_response` templates |
| `CONTEXT.md` | Product glossary |

---

## Notes for Next Session

- UI/UX (Local Studio parity, chat-shell-uiux.md) intentionally deferred
- Do not implement until contracts patched per AGENTS.md workflow
- When promoting to specs: update feature-register, acceptance, test-plan in same change
