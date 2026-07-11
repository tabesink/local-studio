# 05 — Source-to-Target Mapping

| Upstream behavior | Target FastAPI equivalent | Decision |
|---|---|---|
| `PlanExecute` `TypedDict` mutated across graph nodes | Immutable-ish `TurnState` Pydantic/dataclass plus small update functions | Keep semantics; improve testability. |
| `StateGraph` / conditional edges | Explicit bounded orchestrator loop | Remove framework dependency for one-turn flow. |
| `curr_state` PyVis highlighting | Safe SSE `stage` events | Keep observability, not UI coupling. |
| `aggregated_context: str` | `EvidenceBundle[EvidenceRef]` plus `DerivedFact` records | Preserve provenance. |
| 3 local FAISS stores | One private domain-scoped `RetrievalPort` with `intent` | No second retrieval stack. |
| Entity anonymize/de-anonymize | Optional `PlannerNormalizer` | Keep only after benchmark proves value. |
| LLM tool routing | Closed enum `RetrievalIntent | answer` | Keep constrained operation set. |
| LLM relevance/grounding | `EvidenceVerifier`, one repair max | Keep grounding; bound cost/latency. |
| Streamlit `recursion_limit=45` | Server-owned budgets and deadline | Mandatory. |
| Final answer from raw string context | Final answer + citation validator | Mandatory. |
| Notebook evaluation / Ragas | Offline fixture suite + Ragas optional runner | Keep separate from request path. |
| OpenAI keys in `.env` for demo | Provider configuration held server-side | Mandatory. |

## What to implement first

```text
1. typed retrieval evidence
2. direct grounded single-turn answer
3. bounded planner/router loop
4. citations + deletion/redaction handling
5. SSE progress and evaluation harness
```

Do not start with named-entity anonymization, summary lanes, or a graph visualization. They are fidelity enhancements, not the trust boundary.
