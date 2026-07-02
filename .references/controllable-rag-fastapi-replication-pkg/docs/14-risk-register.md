# 14 — Risk Register

| Finding | Type | Target response |
|---|---|---|
| Notebook-first code has import-time retriever creation and globals. | Observed | Dependency-inject adapters at app startup; request-scoped turn state. |
| Three local FAISS stores have no app-level authorization/deletion contract. | Observed | One domain-scoped retrieval adapter with typed evidence. |
| `allow_dangerous_deserialization=True` appears in FAISS loading. | Observed | Never load untrusted serialized indexes; do not carry this setting forward. |
| String concatenation loses exact provenance and token control. | Observed | `EvidenceRef` + token-budgeted `EvidenceBundle`. |
| LLM verifier loops have no explicit retry limits in graph logic. | Observed | Stage-specific retry and turn deadline. |
| The reference prompt asks for chain-of-thought. | Observed | Do not request, persist, or stream hidden reasoning; generate concise answer + citations. |
| Planner/tool output can be malformed. | Inferred | Validate against closed Pydantic enums; fail closed. |
| LLM verifier can be wrong. | Inferred | Treat it as one signal; enforce deterministic citation/scope checks first. |
| Complex planning raises cost/latency. | Inferred | Fixed budgets, test fixtures, optional server-side complexity gate after baseline parity. |
| API/browser can become coupled to orchestration internals. | Inferred | Emit stable stage events, not graph state or raw plan. |

## Explicitly deferred

- durable pause/resume;
- human approval checkpoints;
- cross-domain agent memory;
- concurrent subplans;
- autonomous web/tool calling;
- generic workflow platform;
- multi-retrieval-engine fallback.
