# 01 — Upstream File Map

| Upstream path | Role | Carry forward? |
|---|---|---|
| `sophisticated_rag_agent_harry_potter.ipynb` | Tutorial/index build walkthrough and evaluation exercise. | Learn from it; do not ship it. |
| `functions_for_pipeline.py` | Retrieval functions, LLM chains, LangGraph state and control graph. | Yes — primary behavior reference. |
| `helper_functions.py` | PDF chapter splitting, quote extraction, text helpers, metric display helpers. | Only concepts; replace parser/index implementation. |
| `simulate_agent.py` | Streamlit + PyVis graph/state visualizer. | Replace with safe SSE stage events. |
| `chunks_vector_store/` | FAISS fact/chunk index. | No — map to approved retrieval adapter. |
| `chapter_summaries_vector_store/` | FAISS summary index. | Logical retrieval view only; no second local index. |
| `book_quotes_vectorstore/` | FAISS quote index. | Logical evidence constraint only. |
| `docker-compose.yml` | Single Streamlit container at port 8501. | Replace with application compose topology. |

## Source map

```text
notebook ──────────────── builds tutorial corpus + evaluates it
                              │
                              ▼
functions_for_pipeline.py ── runtime control graph
  ├── create_retrievers()
  ├── qualitative retrieval subgraphs
  ├── qualitative answer subgraph
  └── create_agent()
                              │
                              ▼
simulate_agent.py ──────── live graph visualization
```

**OBSERVED:** `functions_for_pipeline.py` loads three persisted FAISS stores and creates retrievers with `k=1` for chunks/summaries and `k=10` for quotes. It defines a typed graph state called `PlanExecute` and builds the primary `create_agent()` graph.

**Source:** [`functions_for_pipeline.py`](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/functions_for_pipeline.py)
