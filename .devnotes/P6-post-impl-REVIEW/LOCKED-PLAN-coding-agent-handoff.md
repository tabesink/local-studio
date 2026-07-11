# Locked Plan — Coding Agent Handoff

Status: **approved for implementation**  
Date: 2026-07-06 (grill gates locked same day)  
Audience: coding agent implementing Pre-P7 infra closure and F-007 (P7)  
Authority: user grill decisions + active specs (`specs/03-contracts/*`, `specs/04-features/F-007-*`) + CHG-017/018/019

This document supersedes conflicting notes in older `.devnotes/P6-post-impl-REVIEW/*` drafts where they disagree with active contracts or the locked decisions below.

---

## 1. Mission

Deliver two sequential slices:

```text
Slice A — Pre-P7 Production Runtime Integration (BLOCKER)
  Replace test doubles with production private runtime boundaries
  before any F-007 chat code ships.

Slice B — F-007 Agentic Chat And Streaming (P7)
  Owner-scoped conversations, server-classified turns, SSE, redaction.
  Build only after Slice A passes its acceptance gate.
```

Do not start F-007 migrations, routes, or chat services until Slice A is complete.

---

## 2. Current State (P1–P6)

| Phase | Feature | Status | Notes |
| --- | --- | --- | --- |
| P1 | F-001 Trusted foundation | implemented | Cookie sessions, authz, health |
| P2 | F-002 Runtime config | implemented | Encrypted credentials, resolver |
| P3 | F-003 Domains/runtime | implemented | Production default: `DockerDomainRuntimeController`; `Local*` test-only |
| P4 | F-004 Source prep | implemented | Synthetic parser normalizers; live SDK deferred to F-008 |
| P5 | F-005 LightRAG indexing | implemented | Production default: `NativeVendoredLightRAGClient`; sidecar test-only |
| P6 | F-006 Evidence retrieval | implemented | `retrieve_scoped_evidence()`; native app-boundary test exists |

**Slice A code status:** wiring largely done. **Slice A gate status:** **NOT DONE** until CI runs **live Docker** integration (LD-005).

Production defaults (`context_engine/config.py`):

```text
CE_DOMAIN_RUNTIME_CONTROLLER_KIND=docker   # default
CE_LIGHTRAG_CLIENT_KIND=native           # default
CE_DOMAIN_CONTROLLER_COMMAND=<required on target infra / CI Docker job>
```

Tests use `lightrag_client_kind=local` via `conftest.py` for fast unit tests. That is intentional (LD-006).

---

## 3. Locked Decision Gates (2026-07-06 grill)

| ID | Gate | Locked choice | Junior dev rule |
| --- | --- | --- | --- |
| **LD-001** | Native LightRAG before P7 | Yes | Production path uses `NativeVendoredLightRAGClient` only |
| **LD-002** | Docker controller before P7 | Yes | Production path uses `DockerDomainRuntimeController` only |
| **LD-003** | Bundle infra | Together | One Slice A gate, not split |
| **LD-004** | Redaction storage | Option C | Keep rows + `redacted_at`; public fields empty |
| **LD-005** | Slice A done when | **Live Docker in CI** | Subprocess fake is not enough; add CI job with real `CE_DOMAIN_CONTROLLER_COMMAND` |
| **LD-006** | Local fakes | Test injection only | `Local*` stays in repo; never production default |
| **LD-007** | Traceability | Extend F-003/F-005 acceptance | No new feature ID |
| **LD-008** | Orchestrator v1 | **Single-hop** | retrieve → answer → cite; replan loop later |
| **LD-009** | Intents v1 | **Label-only** | Same query string; intent stored in counters/logs |
| **LD-010** | Intent classifier v1 | **Deterministic rules** | No LLM call for routing |
| **LD-011** | Missing domain | **422 `domain_required`** | No SSE; no direct fallback |
| **LD-012** | Budget caps v1 | See §3.1 | Hard limits in tests |
| **LD-013** | Provider tests | **Mock stream in CI** | Live synthesis at pilot only |
| **LD-014** | Redaction scope | **Whole turn** | One deleted cited source → entire turn redacted |
| **LD-015** | Redacted ref FKs | **Keep orphan private FKs** | Audit only; never public |
| **LD-016** | Idempotent replay | **Full SSE transcript** | Reconstruct stage/evidence/token/done from DB |
| **LD-017** | Live parser SDK | **F-008 pilot gate** | Synthetic parsers OK through P7 |
| **LD-018** | Classifier patterns | **Question-shape regex list in code** | Never scan corpus filenames or per-domain vocab for routing |
| **LD-019** | domainId supplied | **Always domain_rag** | Even `"Hello"` + domainId → validate domain then domain_rag |
| **LD-020** | Docker CI shape | **GitHub Actions + Docker service + controller script** | Lifecycle-only proof; not full upload/index/E2E in CI v1 |
| **LD-021** | Controller script | **`scripts/ce-domain-controller.py` + Alpine stub container** | Real `docker run`; does **not** start LightRAG (in-process via NativeVendoredLightRAGClient) |

### 3.1 Budget caps (LD-012)

```text
max_plan_steps           = 2
max_retrieval_operations = 2
max_repair_attempts      = 1
turn_timeout_seconds     = 120
```

Exhaustion → `stop_reason = turn_budget_exhausted` (safe terminal; no fabricated answer).

Example: orchestrator calls retrieve twice on single-hop v1 → second retrieval blocked by budget test.

### 3.2 Intent classifier fixtures (LD-010, LD-011)

Implement as deterministic rules **before** LLM turn. Minimum fixture table:

| Message | domainId | Route | HTTP if blocked |
| --- | --- | --- | --- |
| `"Hello"` | absent | `direct_llm` | — |
| `"Help me rephrase this sentence"` | absent | `direct_llm` | — |
| `"What startup sequence does the manual require?"` | `"manuals"` (available) | `domain_rag` | — |
| `"What startup sequence does the manual require?"` | absent | — | **422 `domain_required`** |
| `"Summarize the fatigue domain SOP"` | absent | — | **422 `domain_required`** |
| `"What startup sequence…"` | unknown slug | — | **404 `domain_not_found`** |
| Forbidden field `route: direct_llm` in body | any | — | **422 `validation_error`** |

Rule sketch for v1:

```text
if request has forbidden control fields → 422
if domainId supplied → validate domain; domain_rag path
else if message matches domain/source/operational patterns → 422 domain_required
else → direct_llm
```

Pattern examples (implementation may expand list): `manual`, `document`, `source`, `domain`, `procedure`, `policy`, `according to`, `in the`.

**LD-018 — question-shape only, not document inventory**

New Source Documents do **not** change classifier patterns. Routing uses how the user asks, not what's indexed.

Checked-in list (v1 starter — extend with tests, not with uploads):

```python
DOMAIN_REQUIRED_PATTERNS = [
    r"\bmanual\b",
    r"\bdocument\b",
    r"\bsource\b",
    r"\bprocedure\b",
    r"\bpolicy\b",
    r"\bsop\b",
    r"\baccording to\b",
    r"\bin the (doc|file|pdf|manual)\b",
    r"\bknowledge domain\b",
    r"\bwhat does .+ say\b",
    r"\bsummarize .+ (doc|document|manual|sop|policy)\b",
]
```

**LD-019 — domainId supplied**

```text
"Hello" + domainId=manuals → domain_rag (after domain validation)
Do not ignore domainId for direct_llm in v1.
```

### 3.3 Orchestrator v1 shape (LD-008, LD-009)

```text
domain_rag v1:
  classify → plan (1 step) → retrieve_* once → evidence SSE
  → answer tokens → citation validate → done

NOT in v1:
  replan loop, multi-hop retrieve chain, separate retriever per intent
```

Intent label example (same query):

```python
# All three call the same thing in v1:
retrieval_port.retrieve(domain_id, question=user_message, intent="fact")
retrieval_port.retrieve(domain_id, question=user_message, intent="overview")
# Only the persisted counter/intent field differs.
```

### 3.4 Redaction (LD-004, LD-014, LD-015)

Example: turn cited `manual.pdf`. Admin deletes `manual.pdf`.

```text
conversation_turns:
  status=redacted, stop_reason=redacted, assistant_answer=null, user_message kept

every conversation_turn_evidence_refs for that turn:
  redacted_at=now, excerpt/citation_label/source_label=null
  source_document_id kept even after source row deleted (orphan FK OK)

GET /conversations/{id}:
  evidence=[], citations=[]
```

Public mappers: `redacted_at IS NOT NULL` → omit from API/SSE/replay. Never expose private FKs.

---

## 4. Locked Contract Decisions (already in specs)

P7 public contracts are closed. Implement against these; do not invent shapes.

| Change | What is locked | Primary spec |
| --- | --- | --- |
| CHG-017 | Conversation CRUD, turn stream request, idempotency replay, pre-stream JSON errors, terminal SSE outcomes, safe error codes, mapped-evidence bridge | API-001, EVT-001, DATA-001, AI-001 |
| CHG-018 | Redaction Option C (`redacted_at` retention) | DATA-001, API-001 |
| CHG-019 | Grill gates: budgets, rules classifier, single-hop v1, label-only intents, whole-turn redaction, orphan FKs, live Docker CI gate | AI-001, DATA-001, this doc |

### P7 architecture locks (do not reopen)

| Rule | Source |
| --- | --- |
| Route is server-owned: `direct_llm` vs `domain_rag` | AI-001, API-001 |
| Browser sends only `clientRequestId`, `message`, optional `domainId` | API-001 |
| One running turn per conversation | DATA-001 |
| No fallback from missing Evidence to direct LLM | AI-001 |
| Provider failure after Evidence → `evidence_only` (completed, no answer tokens) | EVT-001, AI-001 |
| No grounded context → `no_grounded_context` (completed, no answer tokens) | EVT-001 |
| Pre-stream failures → JSON error, not half-open SSE | API-001 |
| One RetrievalPort over F-006 callable; no direct LightRAG in chat | ARCH-002, component-boundaries |
| `fact` / `overview` / `verbatim` = intent labels over one retriever | AI-001, CHG-016 |
| No LangChain, LangGraph, FAISS, second vector store | F-007 spec |
| SSE events: `stage`, `evidence`, `token`, `done`, `error` only | EVT-001 |
| Public evidence id = `conversation_turn_evidence_refs.id` | API-001, EVT-001 |
| Other user's conversation → 404 | API-001 |

### Evidence ref public shape

```json
{
  "id": "evref_01",
  "citationLabel": "[1]",
  "sourceLabel": "manual.md",
  "excerpt": "Bounded excerpt."
}
```

SSE `done.citations` references `evidenceRefId` + `citationLabel` only.

---

## 5. Slice A — Pre-P7 Production Runtime Integration

**Blocks:** F-007 T-010 and all later F-007 tasks.

### Goal

Replace test doubles with production private runtime boundaries while preserving existing P3–P6 API contracts and test coverage.

### Build shape

```text
DomainRuntimeController (protocol)
  ├── DockerDomainRuntimeController   ← production default from settings
  └── LocalDomainRuntimeController    ← tests only; never default in app factory

LightRAGClient (protocol)
  ├── NativeVendoredLightRAGClient    ← production; imports vendor/lightrag/ only through lightrag_runtime helper
  └── LocalLightRAGIndexClient        ← tests only; explicit test injection

App wiring:
  controller_from_settings() → Docker impl
  index_client_from_settings() → Native impl
  evidence retrieve path → Native impl
```

### Slice A tasks (required order)

| Task | Work | Verification |
| --- | --- | --- |
| A-010 | Protocols + production defaults (mostly done) | Defaults docker + native; Local* not in app factory |
| A-020 | Ship `scripts/ce-domain-controller.py` (LD-021) + `@integration_docker` test | CI Docker job green |
| A-030 | Add `.github/workflows/integration-docker.yml` | Runs `pytest -m integration_docker -q` |
| A-040 | Document F-003/F-005 acceptance updates (LD-007) | Traceability + impl logs |
| A-900 | Full pytest green locally + Docker CI job green | Both required |

### Slice A acceptance gate (LD-005)

All must pass before F-007:

- [x] Production defaults: docker controller + native LightRAG client
- [x] `Local*` reachable only via test injection (`conftest`, explicit settings)
- [x] **CI integration test with live Docker** runs `pytest -m integration_docker` against `scripts/ce-domain-controller.py` (`.github/workflows/integration-docker.yml`)
- [x] Pinned native fixture test still passes
- [x] Full local pytest suite green (61 passed with `--basetemp .pytest-tmp-full-2`, 2026-07-06)

**Not in CI v1 (defer):** upload → prepare → index → evidence E2E in Docker job.

**Not sufficient alone:** subprocess fake command tests without a Docker daemon (current workspace proof).

### LD-020 — Docker CI job shape (Gate 8B)

**Recommended (locked):** GitHub Actions + Docker daemon — **not** docker-compose for v1 lifecycle gate.

```yaml
# .github/workflows/integration-docker.yml (sketch)
jobs:
  domain-controller:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -e ".[dev]"
      - run: pytest -m integration_docker -q
    env:
      CE_DOMAIN_RUNTIME_CONTROLLER_KIND: docker
      CE_DOMAIN_CONTROLLER_COMMAND: python scripts/ce-domain-controller.py
```

Test scope (**lifecycle only**): provision → start → health true → stop → delete. No upload/index/evidence in this CI job.

Controller script contract (same as today):

```text
argv[1] = action  (provision|start|stop|delete|health)
stdin     = JSON { action, domainId, runtimeInstanceId, runtimeName, runtimeDir }
stdout    = {} or {"healthy": true|false}
exit 0    = success
```

**Option C explained — docker-compose CI (not chosen for v1)**

Use when each domain needs a long-lived LightRAG stack with network/volumes defined declaratively.

```yaml
# docker-compose.ci.yml (example — heavier than lifecycle gate needs)
services:
  lightrag:
    image: your-lightrag-runtime:1.4.16
    volumes:
      - ${RUNTIME_DIR}/workspace:/data
```

```text
CI:
  docker compose -f docker-compose.ci.yml up -d
  CE_DOMAIN_CONTROLLER_COMMAND=python scripts/ce-compose-controller.py
  pytest -m integration_docker
  docker compose down
```

Why not v1: more moving parts (compose file, image publish, port wiring, teardown) for a gate that only needs prove **controller can start/stop a runtime**. Full E2E (upload→evidence) fits better as manual/target-infra or nightly job later.

| Approach | CI proves | Complexity |
| --- | --- | --- |
| **A: GH Actions + script (LD-020)** | lifecycle | Low |
| C: docker-compose | lifecycle or E2E | Medium–high |
| Full E2E in CI | upload→evidence | Highest (defer) |

### LD-021 — `scripts/ce-domain-controller.py` (exact behavior)

**Locked:** real Docker CLI + **Alpine stub container**. Not a LightRAG image.

```text
LightRAG runtime     = in-process in CE worker/API (NativeVendoredLightRAGClient)
Controller script    = lifecycle fence + health signal only
Stub container       = proves Docker integration; mounts workspace + lightrag dirs
```

| Action | Behavior |
| --- | --- |
| `provision` | mkdir `{runtimeDir}/workspace`, `{runtimeDir}/lightrag`; write `controller-state.json` `{started:false, healthy:false}`; `{}` |
| `start` | `docker run -d --name {runtimeName}` Alpine `sleep 3600` with volume mounts; labels `ce.domain_id`, `ce.runtime_instance_id`; state `healthy:true`; `{}` |
| `health` | `{"healthy": true}` iff state started and container running |
| `stop` | `docker rm -f {runtimeName}`; state unhealthy; `{}` |
| `delete` | stop + `rmtree(runtimeDir)`; `{}` |

Private state file: `{runtimeDir}/controller-state.json`. Never print container ids or paths on stdout.

Env:

```text
CE_DOMAIN_CONTROLLER_COMMAND=python scripts/ce-domain-controller.py
```

Test: `tests/test_domain_controller_integration.py` marked `@integration_docker` (skips if no daemon locally; required in CI).

**Deferred:** LightRAG sidecar container until retrieval/index move out-of-process.

---

## 6. Slice B — F-007 Implementation Plan

Start only after Slice A gate passes.

### Required reading (in order)

1. `AGENTS.md`
2. `CONTEXT.md`
3. `specs/03-contracts/api/context-engine-v1.md` (P7 section)
4. `specs/03-contracts/events/context-engine-sse-v1.md`
5. `specs/03-contracts/data/context-engine-data.md` (P7 tables + redaction rules)
6. `specs/03-contracts/ai/grounded-answering.md`
7. `specs/04-features/F-007-grounded-streaming-chat/` (spec, plan, tasks, test-plan, acceptance)
8. `context_engine/services/evidence.py`
9. `tests/test_scoped_evidence_retrieval.py`

### Task order (from F-007 tasks.md + locked plan)

| Task | Work | Key verification |
| --- | --- | --- |
| T-000 | Read docs; confirm Slice A complete | List specs read in implementation log |
| T-010 | Migration: `conversations`, `conversation_turns`, `conversation_turn_evidence_refs` incl. `redacted_at` | Fresh migration test; partial unique running turn; unique `(conversation_id, client_request_id)` |
| T-020 | Conversation CRUD + owner filter + title validation | 404 cross-user; PATCH title |
| T-030 | `ChatTurnService`: idempotency, one-running guard, replay | No provider/retrieval on replay; `client_request_conflict` |
| T-040 | Rules-based intent gate + direct LLM (mock provider stream) | Fixture table §3.2; no retrieval on direct |
| T-050 | **Single-hop** domain RAG + RetrievalPort → F-006; label-only intents | One retrieve; budget tests §3.1; no LangChain import |
| T-060 | `POST .../turns:stream` SSE per EVT-001 | Fixtures: direct, grounded, no_grounded_context, evidence_only, replay, pre-stream JSON errors |
| T-070 | Redaction hooks per LD-004 / CHG-018 | Source delete + domain delete tests: rows retained, public empty |
| T-080 | Eval fixtures | Route + stop_reason recorded |
| T-900 | Run test-plan.md | All AC evidence |
| T-910 | Update acceptance, impl log, feature register | Status = implemented |

### End-to-end flow (implementation target)

```text
POST /api/v1/conversations/{conversation_id}/turns:stream
  → ChatTurnService (authz, idempotency, one-running, pre-claim validation)
  → persist running turn; commit; no txn during provider/retrieval/SSE
  → IntentGate → direct_llm | domain_rag
  → direct_llm: synthesis stream, no Evidence
  → domain_rag: TurnOrchestrator → RetrievalPort → retrieve_scoped_evidence()
  → persist evidence refs (private ids) + safe SSE evidence events
  → citation validation → token stream → terminal done/error
  → settle turn status/stop_reason

Delete paths:
  source delete / domain delete worker → redaction service (before row purge) → LD-004
```

### Layer ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| Route | HTTP/SSE transport, auth dependency | LightRAG, orchestration policy |
| ChatTurnService | idempotency, persistence order, replay, terminal mapping | marker parsing |
| IntentGate | route classification | browser route selection |
| TurnOrchestrator | agentic loop, middleware, budgets | HTTP |
| RetrievalPort | wrap F-006 callable + internal mapped evidence | second retrieval endpoint |
| Redaction service | LD-004 transitions | UI masking |

---

## 7. P6 Hardening (parallel or pre-P7, non-blocking for F-007 start if Slice A done)

Low-risk test additions recommended before pilot:

| Item | Test |
| --- | --- |
| Stopped domain evidence call | `409 domain_state_conflict` (not only 502) |
| Delete during active retrieval | mapper/eligibility returns empty/safe result |
| F-006 acceptance frontmatter | Align YAML `status: implemented` with body |

---

## 8. Rejected — Do Not Build

- LangChain / LangGraph adapters
- Separate fact/overview/verbatim retrievers or FAISS
- Browser model/provider/prompt/top-k controls
- Chat worker / Redis / RQ / Celery / event bus
- Durable public Evidence table beyond turn-scoped refs
- Source navigation UI (P9)
- Admin global chat read
- Widening public P6 evidence endpoint with private ids
- Default production use of `LocalLightRAGIndexClient` or `LocalDomainRuntimeController`

---

## 9. Acceptance Proof Matrix (Definition of Done)

### Slice A

| Criterion | Evidence required |
| --- | --- |
| Native client wired | Code path + integration test through evidence endpoint |
| Docker controller wired | Runtime start/stop/delete/health proof |
| Sidecar not default | Startup wiring test or grep gate |
| CE_BLOCK app boundary | Test in `test_scoped_evidence_retrieval.py` |
| Full suite | pytest output in implementation log |

### Slice B (F-007 AC-001–AC-016)

Map each AC in `specs/04-features/F-007-grounded-streaming-chat/acceptance.md` to:

- named test function, and/or
- SSE fixture file, and/or
- OpenAPI snapshot

Minimum extra proofs for locked decisions:

| Locked decision | Required test |
| --- | --- |
| LD-004 Option C | After source delete: DB row exists with `redacted_at`; API returns empty evidence/citations; `userMessage` preserved |
| LD-001 one RetrievalPort | Import scan + intent tests for fact/overview/verbatim same path |
| CHG-017 replay | Duplicate `clientRequestId` does not call provider/retrieval |
| CHG-017 pre-stream errors | Validation/domain errors return JSON before `text/event-stream` |

---

## 10. Documentation Updates Required on Completion

Same change set as code:

- `specs/04-features/F-007-grounded-streaming-chat/acceptance.md`
- `specs/04-features/F-007-grounded-streaming-chat/implementation-log.md`
- `specs/07-traceability/feature-register.md`
- `specs/07-traceability/change-log.md` (if contracts touched)
- OpenAPI snapshot for P7 routes
- SSE transcript fixtures per EVT-001

For Slice A, update F-003/F-005/F-006 implementation logs if boundary wiring changes.

---

## 11. Stop Conditions (escalate, do not guess)

Stop and request a decision if:

- Slice A cannot run Docker/native LightRAG in target environment
- A public contract change is needed without migration/version policy
- Pinned LightRAG fixture fails `CE_BLOCK` preservation through native client
- Implementation needs browser-visible source/block ids
- LangChain/LangGraph appears necessary for orchestration
- Redaction ordering cannot run before source row delete with current delete service

---

## 12. Quick Reference — Safe Error Codes (P7)

| Situation | HTTP | Code |
| --- | --- | --- |
| Unknown/other-user conversation | 404 | `conversation_not_found` |
| Validation / forbidden fields | 422 | `validation_error` |
| Domain required but absent | 422 | `domain_required` |
| Running turn / duplicate in progress | 409 | `conversation_turn_in_progress` |
| Same clientRequestId, different message/domain | 409 | `client_request_conflict` |
| Synthesis profile not ready | 409 | `synthesis_profile_not_ready` |
| Provider failure before Evidence | SSE `error` | `provider_failure` |
| Client disconnect | persisted | `turn_cancelled` |

Full table: API-001 P7 safe errors section.

---

## 13. One-Line Summary for Agent

**First:** close Slice A with **live Docker CI** + native E2E. **Then:** F-007 chat — rules classifier, single-hop RAG, label-only intents, mock provider tests, full SSE replay, redaction Option C with whole-turn + orphan FKs. **Never:** sidecar defaults, LLM routing, replan loop in v1, LangChain, public private ids.

---

## Related docs (detail, not authority over this plan)

| Doc | Use |
| --- | --- |
| [F-007-P7-readiness.md](./F-007-P7-readiness.md) | Background, build order, AC list |
| [F-007-P7-reconciled-design-gates.md](./F-007-P7-reconciled-design-gates.md) | Gate-by-gate rationale |
| [ID-A.md](./ID-A.md) | P7 blocker index |
| [ID-A-redaction-and-delete-hooks.md](./ID-A-redaction-and-delete-hooks.md) | Redaction ordering |
| Other `ID-A-*.md` | Subsystem detail |

When this locked plan conflicts with an older review draft, **this document wins**.
