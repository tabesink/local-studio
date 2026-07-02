# Controllable RAG Agent → FastAPI Replication Package

**Purpose:** rebuild the useful advanced-RAG control flow from `NirDiamant/Controllable-RAG-Agent` as a lean, modular FastAPI chat backend.

## What this package does

- Reverse-engineers the upstream notebook/demo implementation.
- Separates **observed source behavior** from the **proposed production target**.
- Preserves: plan → route → retrieve/answer → replan → evidence-grounded final answer.
- Replaces: notebook globals, Streamlit-only state display, raw-context strings, unbounded repair loops, and three local FAISS stores.
- Targets a modular chat shell: browser → FastAPI → PostgreSQL + one private retrieval adapter/runtime per domain.

## Read order

1. `docs/00-evidence-and-scope.md`
2. `docs/02-observed-runtime-architecture.md`
3. `docs/04-query-control-graph.md`
4. `docs/05-source-to-target-matrix.md`
5. `docs/06-target-fastapi-architecture.md`
6. `docs/12-implementation-slices.md`
7. `AGENTS.md`

## Package map

```text
.
├── AGENTS.md                         # operating rules for coding agents
├── README.md
├── docs/
│   ├── 00-evidence-and-scope.md
│   ├── 01-upstream-file-map.md
│   ├── 02-observed-runtime-architecture.md
│   ├── 03-observed-ingestion-and-indexes.md
│   ├── 04-query-control-graph.md
│   ├── 05-source-to-target-matrix.md
│   ├── 06-target-fastapi-architecture.md
│   ├── 07-module-boundaries.md
│   ├── 08-state-persistence-and-deletion.md
│   ├── 09-api-and-sse-contract.md
│   ├── 10-retrieval-evidence-and-grounding.md
│   ├── 11-loop-budgets-and-failure-policy.md
│   ├── 12-implementation-slices.md
│   ├── 13-test-and-evaluation.md
│   ├── 14-risk-register.md
│   ├── 15-reference-code-map.md
│   └── 16-research-consulted.md
└── scaffold/
    ├── target-file-tree.md
    ├── turn-orchestrator.pseudo.py
    └── sse-event-examples.ndjson
```

## Non-negotiable target rules

- FastAPI is the only browser-facing application API.
- The browser sends a message and selected domain only. It cannot select provider, model, top-k, retrieval mode, prompt, hidden filters, or internal tools.
- Current-turn domain scopes retrieval. A conversation may switch domain next turn; it never creates cross-domain retrieval memory.
- Use a single trusted `RetrievalPort` adapter. Do not add a second local vector-store fallback.
- Persist evidence references and safe execution telemetry, **not hidden chain-of-thought**.
- Bound every loop. Return an evidence-grounded insufficiency answer when evidence cannot support a claim.
- Keep the upstream source as a reference implementation, not a production dependency.

## Source status

Reviewed against upstream `main` on **2026-07-02**. The upstream repository is mutable; this package intentionally records file paths and source links rather than claiming a pinned commit hash.
