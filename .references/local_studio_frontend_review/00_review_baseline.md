# Review baseline

| Repo | Branch | Observed short SHA | Review date | Confidence |
|---|---|---:|---|---|
| Local Studio | `main` | `fbc6f96` | 2026-06-29 | Static source review. No live app run. |
| Context Engine | `main` | `1577b51` | 2026-06-29 | Static source review. No live app run. |

Before code change:

```bash
git rev-parse HEAD
```

Record SHA in PR. Re-check paths. `main` moves.

## Evidence tags

| Tag | Meaning |
|---|---|
| **OBSERVED** | Seen in source/docs. |
| **TARGET** | Recommended Context Engine design. Not present until built. |
| **FUTURE ONLY** | Compatibility note. Do not build now. |
| **VERIFY** | Needs runtime/test/source confirmation. |

## Product boundary

```text
Context Engine = multi-user RAG workbench.
FastAPI = business truth.
Next.js = view state + typed API client.
LightRAG = semantic retrieval/indexing capability.
Worker = background parsing/indexing.

Local Studio = local-first LLM/runtime workstation.
Controller = model lifecycle + proxy + metrics + SSE.
Frontend = UI + agent workspace + desktop bridge.
```

Do not import Local Studio controller, Pi runtime, Electron, host filesystem access, terminal control, or agent session persistence into current Context Engine.
