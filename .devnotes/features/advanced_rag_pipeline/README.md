# Controllable RAG → Context Engine Integration Plan v1

**Audience:** junior devs, coding agents  
**Authority:** advisory only — active specs/contracts win  
**Reference:** `.references/controllable-rag-fastapi-replication-pkg/` (evidence, not source of truth)

**One-liner:** P6 proves safe Evidence retrieval; P7 chat shell wraps a bounded `TurnOrchestrator` that reuses P6 as the only retrieval path; advanced plan→retrieve→replan loops ship behind server policy, not a second RAG stack.

---

## Read Order

1. `AGENTS.md`, `CONTEXT.md`
2. `.references/controllable-rag-fastapi-replication-pkg/docs/04-query-control-graph.md`
3. `.references/controllable-rag-fastapi-replication-pkg/docs/06-target-fastapi-architecture.md`
4. `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`
5. `specs/04-features/F-007-grounded-streaming-chat/spec.md`
6. `specs/03-contracts/ai/grounded-answering.md`
7. `specs/03-contracts/events/context-engine-sse-v1.md`
8. This folder
9. `03-langgraph-langchain-agent-links.md` — only when wiring `create_agent` / StateGraph / streaming

---

## Gap: Current Plan vs Target Control Flow

| Layer | F-007 spec today | Controllable RAG reference |
| --- | --- | --- |
| Retrieval | One P6 call per turn | Up to 3 bounded retrieval ops with `fact \| overview \| verbatim` intent |
| Synthesis | Single grounded prompt + stream | Plan → route → retrieve → replan → verify → final answer |
| Progress | `evidence` then `token` | Safe stage events + evidence batches |
| Loops | None specified | Explicit budgets + insufficiency terminals |
| Framework | Not specified | Plain `while` loop — **no LangGraph** |

**Decision:** do not rewrite P6 or F-007 outcomes. **Do** implement F-007 with an orchestrator-shaped module tree so the advanced loop is additive, not a rewrite.

---

## Integration Principle

```text
DO NOT ADD                          DO ADD
────────────────────────────────    ────────────────────────────────────
second vector store / FAISS         TurnOrchestrator (request-scoped)
separate agent microservice         RetrievalPort → existing P6 callable
LangGraph / durable checkpoints     bounded while-loop + typed policy
browser model/top-k/mode controls   server-owned synthesis profile (F-002)
raw planning text in SSE            safe stage labels only
notebook globals / Streamlit state    conversations + turns (F-007 data)
```

P6 stays **evidence-only HTTP proof**. Chat turns call the **same retrieval mapper** internally — never duplicate marker parsing or eligibility logic.

---

## End-State Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Next.js Chat Shell (F-009) — modular, thin                            │
│  LightRagChatShell → SSE client → evidence panel + token stream       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ cookie session, domain_id, message only
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ FastAPI  POST /conversations/{id}/turns:stream  (API-001 / EVT-001)    │
│  route → ChatTurnService → TurnOrchestrator → SSE projector           │
└───────┬─────────────────────────────┬───────────────────┬───────────────┘
        │                             │                   │
        ▼                             ▼                   ▼
┌───────────────┐           ┌─────────────────┐   ┌──────────────────┐
│ PostgreSQL    │           │ RetrievalPort   │   │ ProviderGateway  │
│ conversations │           │ (P6 reuse)      │   │ (F-002 synthesis)│
│ turns         │           │  └─ LightRAG    │   │ stream + verify  │
│ evidence links│           │     + CE_BLOCK    │   └──────────────────┘
└───────────────┘           └─────────────────┘
```

**Trust boundary unchanged:** browser sends message + domain. Server owns profile, budgets, retrieval intent, prompts, verification.

---

## Controllable RAG Control Graph (CE Vocabulary)

```text
START Turn(domain_id, question)
  │
  ▼
[plan]                          ← optional when policy.mode = "advanced"
  │
  ▼
for each plan step (budgeted):
  │
  ├─ retrieve(fact|overview|verbatim)
  │     └─ RetrievalPort → P6 mapper → Evidence[]
  │     └─ distill + verify once → vetted Evidence
  │
  └─ answer_from_context          ← intermediate derived fact (non-terminal)
  │
  ▼
[replan / answerable check]       ← break when question answerable
  │
  ▼
[final grounded answer + citation validate + verify once]
  │
  ├── pass → stream tokens → done
  └── fail → repair once → done | insufficiency
END
```

**Pilot default:** `policy.mode = "direct"` runs one `retrieve(overview)` step then final answer — satisfies F-007 AC without multi-hop. Enable `"advanced"` via server config after Slice 3 passes fixtures.

---

## Module Map (target `context_engine/` layout)

```text
context_engine/
├── api/routes.py                    # + conversation CRUD, turn SSE route
├── chat/
│   ├── contracts.py                 # TurnState, TurnOutcome, safe progress DTOs
│   ├── service.py                   # authz, idempotency, txn order, event gen
│   ├── orchestrator.py              # bounded loop (copy shape from reference scaffold)
│   ├── planning.py                  # PlannerPort, Replanner — advanced mode only
│   ├── routing.py                   # closed enum: fact|overview|verbatim|answer
│   ├── events.py                    # map internal progress → EVT-001 (+ optional stage)
│   └── policy.py                    # budgets, mode direct|advanced, timeouts
├── evidence/                        # OR fold into existing F-006 service module
│   ├── retrieval.py                 # RetrievalPort impl — wraps F-006 callable
│   ├── verifier.py                  # distill/ground once
│   └── citations.py                 # post-answer validation
├── providers/
│   └── synthesis_gateway.py         # stream adapter over F-002 trusted config
└── services/
    └── conversations.py             # repository + transcript excerpt policy
```

**Import rule (same as reference):**

```text
api → chat → evidence/retrieval/providers/conversations   OK
retrieval → chat                                          FORBIDDEN
evidence → api                                            FORBIDDEN
```

**Single LightRAG entry:** only `evidence/retrieval.py` (or `services/evidence.py` if F-006 lands there first).

---

## P6 → RetrievalPort Adapter

F-006 builds the callable. Chat never re-implements mapping.

```text
RetrievalPort.retrieve(domain_id, query, intent, policy)
  │
  ├─ intent → LightRAG mode / query shaping (server mapping table)
  ├─ call private LightRAG retrieve
  ├─ strict CE_BLOCK parser + Source Block mapper
  ├─ source_is_query_eligible() filter
  └─ return list[Evidence]  (safe DTO, turn-scoped ids)
```

| Reference `RetrievalIntent` | CE behavior |
| --- | --- |
| `fact` | narrow, entity-focused retrieval query |
| `overview` | default single-turn retrieval (F-007 direct mode) |
| `verbatim` | prefer block-aligned excerpt hits |

Intent mapping lives in `policy.py` — not browser input.

---

## Chat Shell Modularity (F-009)

UI is a **shell** around turn lifecycle. Backend orchestrator is swappable; SSE contract is stable.

```text
/chat
└── LightRagChatShell                 ← owns turn state machine
    ├── ConversationView              ← messages only
    ├── ChatComposer                  ← domain select + send
    └── ContextPanelShell             ← tab host (v1: evidence tab)
          └── SessionContextNavigation  ← binds to evidence SSE events
```

**Shell rules:**

```text
Shell consumes:  evidence | token | done | error  (+ optional stage)
Shell never:     calls LightRAG, passes model/top-k, stores provider keys
Shell binds:     assistantMessageId ↔ evidence panel rows
Shell aborts:    AbortController on cancel / domain switch
```

Port old CE client geometry; rewire event names to EVT-001 fixtures. See `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-chat-shell-flow.md`.

---

## Implementation Slices (fits existing phase gates)

Build vertical. Do not start advanced loop before P6 callable exists.

```text
Slice CE-0  P6 evidence callable + POST /domains/{id}/evidence
            └─ F-006 — no synthesis

Slice CE-1  Chat foundation
            conversations/turns schema, CRUD, idempotency, one-running-turn
            └─ F-007 T-010..T-030

Slice CE-2  Direct grounded turn (orchestrator mode=direct)
            1× retrieve(overview) → evidence SSE → stream answer → done
            citation validator, no_grounded_context, evidence_only fallback
            └─ F-007 T-040..T-050 — satisfies pilot AC

Slice CE-3  Safe progress projection
            optional `stage` SSE event OR embed stage in server logs only first
            client stage indicator in chat shell
            └─ EVT-001 patch + F-009 slice 12

Slice CE-4  Advanced orchestrator (mode=advanced)
            planner → router → multi retrieve → replan → bounded verify
            └─ new F-007 tasks OR F-007.1 follow-on feature

Slice CE-5  Redaction + delete hooks
            └─ F-007 T-060

Slice CE-6  Evaluation fixtures
            direct + multi-hop JSONL cases, budget compliance tests
            └─ reference docs/13-test-and-evaluation.md pattern
```

**Stop condition:** if P5 native LightRAG gate (T-060 / `vendor/lightrag/`) is open, block CE-0 — same as `.devnotes/P5-post-impl-REVIEW/F-006-P6-readiness.md`.

---

## Loop Budgets (server config, not browser)

Initial values — tune in `chat/policy.py`:

```text
MAX_PLAN_STEPS               = 5
MAX_RETRIEVAL_OPERATIONS     = 3
MAX_REPAIR_ATTEMPTS_PER_STEP = 1
MAX_FINAL_ANSWER_RETRIES     = 1
TURN_TIMEOUT_SECONDS         = 90
```

Terminal outcomes must map to AI-001 safe fallbacks: `no_grounded_context`, `evidence_only`, insufficiency text — never raw provider errors.

---

## Contract Deltas Required Before Advanced Mode

| Contract | Change | When |
| --- | --- | --- |
| EVT-001 | optional `stage` event: `planning \| retrieving \| verifying \| answering` | Slice CE-3 |
| AI-001 | document orchestrator modes, budgets, insufficiency terminals | Slice CE-4 |
| API-001 | capture turn SSE route body (domain_id, client_request_id, message) | Slice CE-1 |
| F-007 spec/tasks | add T-070 orchestrator + T-080 advanced-mode fixtures | Slice CE-4 |

**Do not patch contracts silently.** Pilot can ship Slice CE-2 on existing EVT-001 four-event shape.

---

## SSE Sequence (pilot direct mode)

```text
client POST turn
  → event: evidence     { items: [...] }      # once, before tokens
  → event: token        { text: "..." }        # ×N
  → event: done         { citations, stop }    # exactly one terminal
```

Advanced mode adds repeated `evidence` emissions (one batch per retrieval op) — client appends to panel ledger; shell already supports per-assistant evidence binding.

---

## Rejected (do not pull into CE)

```text
✗ LangGraph / checkpoint persistence
✗ Redis, Celery, chat worker queue
✗ Separate agent server
✗ Local FAISS fallback index
✗ Entity anonymize/de-anonymize (until benchmark proves value)
✗ Browser retrieval tuning
✗ Hidden chain-of-thought in SSE or DB
✗ General/domainless chat branch
```

---

## Junior Dev Checklist

```text
□ P6 callable returns safe Evidence — chat imports it, does not fork logic
□ Orchestrator has zero DB session / HTTP request inside loop body
□ Every loop has a counter and a terminal outcome
□ Citations reference current-turn evidence ids only (AI-001)
□ SSE fixtures captured before F-009 streaming UI merges
□ Advanced mode disabled by default until CE-4 tests pass
□ Read reference scaffold/turn-orchestrator.pseudo.py for loop shape only
```

---

## Reference ↔ CE Quick Map

| Reference module | CE owner |
| --- | --- |
| `modules/chat/orchestrator.py` | `context_engine/chat/orchestrator.py` |
| `modules/retrieval/ports.py` | F-006 evidence service |
| `modules/evidence/*` | `context_engine/evidence/` or F-006 + chat verifier |
| `modules/providers/*` | F-002 `TrustedRuntimeConfig` |
| `modules/conversations/*` | F-007 conversations service |
| `POST /api/v1/chat/turns:stream` | API-001 P7 route (path per contract capture) |

---

## Open Items (resolve before CE-4)

1. P5 vendored LightRAG promotion gate — blocks native retrieval proof  
2. Exact P7 SSE route path + request DTO in API-001  
3. Whether `stage` SSE is pilot-required or post-pilot  
4. Planner provider budget — same synthesis profile or admin-only override  

---

## See Also

- `03-langgraph-langchain-agent-links.md` — LangGraph/LangChain/create_agent/web-search links for coding agents
- `.references/controllable-rag-fastapi-replication-pkg/docs/12-implementation-slices.md`
- `.devnotes/P5-post-impl-REVIEW/F-006-P6-readiness.md`
- `specs/02-architecture/component-boundaries.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-chat-shell-flow.md`
