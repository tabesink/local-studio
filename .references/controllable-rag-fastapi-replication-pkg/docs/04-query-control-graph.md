# 04 — Query Control Graph

## Upstream graph, normalized

```text
START
  │
  ▼
[anonymize question]
  │
  ▼
[plan]
  │
  ▼
[restore entities]
  │
  ▼
[make plan executable]
  │
  ▼
[choose one allowed tool]
  ├─────────────── retrieve fact ───────────────┐
  ├─────────────── retrieve overview ────────────┤
  ├─────────────── retrieve verbatim ────────────┤
  └─────────────── answer from current context ──┤
                                                  ▼
                                               [replan]
                                                  │
                              ┌── answerable? ────┴─────┐
                              │ yes                      │ no
                              ▼                          ▼
                       [final grounded answer]   [make remaining plan executable]
                              │                          │
                              ▼                          └── loop
                             END
```

## Subgraph 1: qualitative retrieval

```text
retrieve raw candidates
      │
      ▼
distill relevant content
      │
      ▼
verify distilled content is grounded in raw candidates
      ├── yes → vetted context
      └── no  → distill again
```

## Subgraph 2: qualitative answer

```text
generate answer from context
      │
      ▼
verify answer is grounded in context
      ├── yes → accepted answer
      └── no  → generate again
```

## Source-backed observation

**OBSERVED:** the graph includes conditional loops for distillation grounding and answer grounding. The Streamlit runner supplies a `recursion_limit`, but the core graph itself does not own explicit per-stage retry counters or a request deadline.

## Target control rule

**PROPOSED:** preserve the state-machine semantics but implement a plain, testable orchestration loop. Do not require LangGraph for one request-scoped, bounded workflow.

```text
state + deterministic `while` loop + typed decisions + explicit budgets
```

LangGraph may be reconsidered only if a later requirement needs durable interruption/resume or human approval. It is not required for this target’s single-turn advanced RAG execution.
