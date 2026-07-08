---
id: AI-001
title: Chat Answering And Agentic RAG
status: approved
owner: Context Engine retrieval and chat team
last_reviewed: 2026-07-06
depends_on: [API-001, EVT-001, DATA-001]
supersedes: []
---

# Chat Answering And Agentic RAG

## Capability

Context Engine answers one user chat turn through one of two server-owned routes:

1. `direct_llm`: narrow direct LLM response for non-domain general chat only.
2. `domain_rag`: advanced agentic RAG against one selected Knowledge Domain, using exact mapped Evidence, citations, and safe insufficiency fallbacks.

The browser sends the message, optional `domain_id`, and `client_request_id`; it never chooses route, model, prompt, retrieval mode, or tools.

## Guardrails

- Direct LLM is allowed only when the server intent gate classifies the user message as non-domain general chat. It emits no evidence and no citations.
- Domain-specific, source-specific, operational, or ambiguous knowledge questions must use `domain_rag` with one selected Knowledge Domain, or fail/ask for a domain before retrieval.
- Missing or weak Evidence in `domain_rag` must return `no_grounded_context` or another safe insufficiency terminal; it must not fall back to direct LLM.
- Intent classification and supplied-domain validation must happen before claiming a running Turn row. A missing required domain, unknown supplied domain, or unavailable supplied domain returns a normal JSON API error and must not create a half-open SSE stream.
- No prior assistant answers in the prompt.
- No browser model/provider/prompt/retrieval controls.
- Domain RAG prompt uses current-turn Evidence and bounded prior user questions only; direct LLM uses bounded conversation context without Evidence or citations.
- Citations must reference current-turn evidence IDs.
- Provider failure after evidence returns evidence-only fallback, not raw provider error.
- Provider failure after Evidence returns `evidence_only` with no answer tokens in P7. Provider failure before Evidence or during direct LLM returns a safe terminal error.
- No web search, open tool use, local fallback vector store, or browser-selected tool choice in P7.

## Advanced Domain RAG Orchestration

Domain RAG uses a CE-native `TurnOrchestrator` with a small typed middleware chain over Context Engine services. Do not use LangChain, LangGraph, `create_agent`, `create_react_agent`, `StateGraph`, or framework adapters for F-007.

```text
classify intent
  -> plan
  -> route operation: retrieve_fact | retrieve_overview | retrieve_verbatim | answer_from_evidence
  -> P6 RetrievalPort -> exact Evidence[]
  -> middleware: budget | allowlist | evidence safety | verifier | citation validator | SSE projector
  -> replan until answerable or budget exhausted
  -> final answer
  -> citation validation and one repair attempt
```

The CE-native middleware layer is an internal composition pattern, not a plugin system. Middleware may enforce policy around a turn, retrieval result, draft answer, terminal outcome, or safe SSE projection. Middleware must be statically registered server-side and must not be selected, reordered, or extended by browser input.

## Retrieval Intent Model

Context Engine has one physical retrieval path for chat: `RetrievalPort.retrieve(domain_id, query, intent, policy)` calling the F-006 evidence callable, which calls the selected Knowledge Domain's private LightRAG runtime. The upstream controllable-RAG reference used separate retrievers; Context Engine does not recreate them.

For P7 chat, the RetrievalPort must return an internal mapped-evidence result with private Source Document and Source Block ids plus safe excerpt/source label. This internal bridge is required for citation validation and redaction. The public P6 endpoint remains unchanged and must not expose private ids.

The advanced orchestrator may pass exactly three retrieval intent labels to the same port:

| Intent | Meaning | Physical retriever |
| --- | --- | --- |
| `fact` | narrow entity/value/supporting-passage lookup | same P6 LightRAG domain retriever |
| `overview` | broader document/section/procedure context | same P6 LightRAG domain retriever |
| `verbatim` | exact wording or quote-like excerpt lookup | same P6 LightRAG domain retriever |

These intents are server-owned query-shaping policy only. They are not separate retrievers, indexes, vector stores, endpoints, browser controls, or LightRAG runtimes.

**P7 v1 intent behavior (LD-009):** `fact`, `overview`, and `verbatim` are label-only in v1. They may be persisted in counters/logs but must call the same `RetrievalPort.retrieve(...)` with the same user question string. Query rewrite per intent is deferred until a later contract patch.

The orchestrator and middleware must enforce:

- closed operations only: `retrieve_fact`, `retrieve_overview`, `retrieve_verbatim`, and internal answer/verification helpers; all `retrieve_*` operations call the same RetrievalPort implementation;
- **P7 v1 orchestration (LD-008):** single-hop domain RAG only — one primary retrieve, answer, cite; replan/multi-hop loops are deferred until v1 acceptance passes;
- server-owned budgets with v1 defaults: `max_plan_steps = 2`, `max_retrieval_operations = 2`, `max_repair_attempts = 1`, `turn_timeout_seconds = 120`;
- no raw planning text, chain-of-thought, prompts, raw LightRAG hits, provider payloads, paths, or source text in SSE, API DTOs, logs, fixtures, or traces;
- retrieval through the P6 callable only, never direct LightRAG imports in chat route code;
- no LangChain/LangGraph dependency, adapter, checkpoint, or stream projection layer in the F-007 runtime.

## Direct LLM Route

The direct route is for conversational, non-domain messages such as greetings, app-neutral writing help, or general LLM-only discussion. It must:

- use the trusted synthesis profile resolved server-side;
- omit retrieval, Evidence, citations, source claims, and domain assertions;
- persist the turn as `route = direct_llm`;
- emit `stage` and `token` SSE events plus one terminal `done` or `error`;
- fail closed or ask for a Knowledge Domain when intent is domain-specific or ambiguous.

## Server Intent Gate (P7 v1)

The server classifies each turn with a **deterministic rules-based classifier** in v1. Do not call the synthesis provider solely to choose route.

Rules (minimum):

- Forbidden control fields in the request → validation error before turn claim.
- If `domainId` is supplied, validate it and run `domain_rag` (even for greetings — LD-019).
- If `domainId` is absent and the message matches **question-shape** patterns (LD-018) → `422 domain_required` JSON error; do not open SSE; do not fall back to direct LLM.
- Otherwise → `direct_llm`.

Patterns are a static checked-in regex list in code (`context_engine/chat/intent_patterns.py` or equivalent). Do not load filenames from Source Documents or use web search for route classification. New uploads do not change patterns.

Example: `"What startup sequence does the manual require?"` with no `domainId` → `422 domain_required`. `"Hello"` with no `domainId` → `direct_llm`.

Automated tests must cover the fixture table in `.devnotes/P6-post-impl-REVIEW/LOCKED-PLAN-coding-agent-handoff.md` §3.2.

## Provider Streaming Tests

Unit and integration tests use a mocked synthesis stream adapter. Live provider credentials are required for pilot/manual verification only unless CI explicitly provisions them.

## Indexing And Eligibility Precondition

Before evidence retrieval or grounded answering can use a Source Document, P5 must prove that private LightRAG indexing preserves exact Context Engine Source Block identity through `CE_BLOCK` markers. If the pinned LightRAG fixture cannot prove marker preservation, idempotent submit, native readiness, delete/absence proof, and typed provider-secret injection without unsafe fixture data, F-005 is blocked.

Production native LightRAG runtime integration must use the editable vendored package at `vendor/lightrag/` per ADR-002. Pip-only `lightrag-hku` is not acceptable as the runtime source of truth when Context Engine-owned KG prompt changes are required.

Retrieval and chat phases must call the backend `source_is_query_eligible(source, domain)` predicate and discard any raw LightRAG hit from a source that fails it. Frontend code must not compute query eligibility, and Evidence mapping must not fall back to fuzzy, nearest, parser-native, or remote-runtime chunk identity.

## Evaluation

Required checks include direct-route classification, advanced agent budget compliance, exact `CE_BLOCK` mapping, source query eligibility, no-grounded-context behavior, citation validation, redaction behavior, unsafe payload exclusion, latency/cost metadata capture where safe, and regression cases for adversarial questions that ask for unsupported claims.
