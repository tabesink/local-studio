\
# Context Engine × Local Studio
## Junior Developer Architecture Package

## Read order

1. `01-architecture-review.md` — product boundary. Current vs future.
2. `02-api-data-contract.md` — FastAPI contract. SSE. Pydantic models.
3. `03-frontend-ui-implementation.md` — Next.js structure. UI parity. Phases.

## Goal

Build Context Engine as RAG workbench.

Use Local Studio visual language.

Do not copy Local Studio coding-agent runtime.

Keep future path open for selected capabilities:

```text
agent runtime
tool execution
terminal
workspace artifacts
conversation persistence
```

Future path means documented boundary. Not placeholder code.

## Review baseline

| Repo | Branch | Reviewed SHA | Review date | Confidence |
|---|---|---|---|---|
| Local Studio | `main` | `79939fbe65ee621bbe2e90a3f2cb37c54cf380b9` | 2026-06-28 | Static source review |
| Context Engine | `main` | `1577b5109c4a2c28f52ce7b2c5a2406a7c6ea491` | 2026-06-28 | Static source review |

Before implementation:

```bash
git rev-parse HEAD
```

Record new SHA in PR. Recheck changed source. Repositories move.

## Terms

| Term | Meaning |
|---|---|
| Domain | Context Engine RAG workspace. Access boundary. Document/retrieval scope. |
| Document | User source material. Parsed/indexed for RAG. Not agent filesystem. |
| Evidence | Retrieved document chunk/source data used to support answer. |
| Citation | UI-visible reference to evidence. |
| Chat turn | One question -> one streamed answer. Ephemeral now. |
| Ingestion job | Background parse/index task. |
| Operation | Admin lifecycle/provider/action record. |
| Session | Future persisted ordered conversation. Not built now. |
| Agent run | Future multi-step tool-using runtime. Not built now. |
| Artifact | Future generated workspace file. Not a document. |

## Hard rules

```text
FastAPI owns business truth.
Frontend owns view state.
Documents are not filesystems.
Domain is current access scope.
No browser credential storage.
No fake future routes/models/UI.
One API contract. One token system. One SSE parser.
```
