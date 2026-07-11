# 00 — Evidence and Scope

## Evidence labels

| Label | Meaning |
|---|---|
| **OBSERVED** | Directly present in upstream repository code or README. |
| **INFERRED** | Behavior implied by the implementation; validate during a local run. |
| **PROPOSED** | Target FastAPI design for this rebuild. |
| **REJECTED** | Not carried into target architecture. |

## Upstream scope

**OBSERVED:** the repository is an educational, notebook-first advanced RAG agent for complex questions. Its main implementation file uses LangGraph, LangChain, FAISS, OpenAI embeddings/models, and a Streamlit visualization. The README describes PDF processing, chapter summaries, a quotes index, planning, task routing, verification, and Ragas evaluation.

**OBSERVED source:**
- [README](https://github.com/NirDiamant/Controllable-RAG-Agent#sophisticated-controllable-agent-for-complex-rag-tasks)
- [`functions_for_pipeline.py`](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/functions_for_pipeline.py)
- [`simulate_agent.py`](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/simulate_agent.py)

## Target scope

**PROPOSED:** a server-side, evidence-grounded chat capability with:

```text
Browser chat shell
      │ typed request / safe SSE events
      ▼
FastAPI chat module
      │ request-scoped advanced turn orchestrator
      ├── provider gateway
      ├── retrieval adapter (private, domain-scoped)
      ├── evidence + grounding module
      └── PostgreSQL repositories
```

## Out of scope

**REJECTED:** copying the Harry Potter dataset, Streamlit UI, persisted FAISS directories, notebook globals, public LLM keys, unrestricted planner/tool text, and hidden reasoning display.

## Fidelity statement

The target replicates the upstream **semantic architecture**:

```text
plan → select a constrained operation → collect evidence → verify → replan → final grounded answer
```

It does **not** replicate implementation accidents or tutorial-only storage choices.
