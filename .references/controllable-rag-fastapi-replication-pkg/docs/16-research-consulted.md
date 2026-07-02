# 16 — Research Consulted

## Primary sources

1. **Upstream repository** — source of truth for observed behavior.
   - [Repository README](https://github.com/NirDiamant/Controllable-RAG-Agent)
   - [`functions_for_pipeline.py`](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/functions_for_pipeline.py)
   - [`simulate_agent.py`](https://github.com/NirDiamant/Controllable-RAG-Agent/blob/main/simulate_agent.py)

2. **FastAPI documentation** — target HTTP boundary and streaming design.
   - [Streaming responses](https://fastapi.tiangolo.com/advanced/custom-response/)
   - [Response model filtering](https://fastapi.tiangolo.com/tutorial/response-model/)
   - [APIRouter](https://fastapi.tiangolo.com/reference/apirouter/)
   - [Concurrency guidance](https://fastapi.tiangolo.com/async/)

3. **LangGraph documentation** — explains the graph abstraction used by upstream and why it is not mandatory for this request-scoped target.
   - [Graph API overview](https://docs.langchain.com/oss/python/langgraph/graph-api)
   - [Overview](https://docs.langchain.com/oss/python/langgraph/overview)
   - [Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)

4. **Ragas documentation** — offline evaluation vocabulary and metric capability.
   - [Ragas documentation](https://docs.ragas.io/en/stable/)
   - [Available metrics](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/)

## Decision derived from research

LangGraph models workflows as state, nodes, and conditional edges. The upstream agent uses exactly that style. For this target, a typed bounded loop offers the same immediate control semantics without adding graph persistence, interrupts, or a second orchestration runtime. FastAPI `StreamingResponse` can project safe state changes to the client; the client need not receive internal graph state.
