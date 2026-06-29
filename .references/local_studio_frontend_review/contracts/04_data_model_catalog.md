# 04 — Data Model Catalog

## Current models

| Model | Owner | Stored | Frontend cache | Notes |
|---|---|---|---|---|
| `CurrentUser` | Auth | Postgres/session | App bootstrap | Safe identity/role only. |
| `DomainSummary` | Domain service | Postgres + deploy manifest | Route list | Access scoped. |
| `DomainDetail` | Domain service | Postgres + runtime status | Detail panel | Includes lifecycle safe state. |
| `DocumentSummary` | Document service | Postgres/storage | Library page | Domain scoped. |
| `DocumentDetail` | Document service | Postgres/storage | Detail panel | Parser/job/assets. |
| `IngestionJobDetail` | Job/worker service | Postgres/queue state | Polling UI | Server status only. |
| `EvidenceReference` | Retrieval service | Generated per turn | Current turn | IDs durable; body may be hydrated. |
| `EvidenceChunk` | Document/retrieval service | Document store | Inspector | Authorized separately. |
| `Citation` | Synthesis service | Generated per turn | Current turn | Points to evidence. |
| `GraphResponse` | Graph/LightRAG mapper | Remote graph + mapping | Graph page | Bounded query. |
| `ProviderConfig` | AI settings service | Secure config/DB | Admin page | Secrets write-only. |
| `ModelProfile` | AI settings service | DB/config | Admin/page and chat safe status | LLM vs embedding. |
| `OperationDetail` | Admin/operation service | Postgres/log store | Admin panel | Redacted diagnostics. |
| `AuditEvent` | Audit service | Postgres | Admin page | Security/admin truth. |

## Future-only models

| Model | Trigger | Why current model cannot absorb it |
|---|---|---|
| `AgentRun` | Multi-step tool runtime approved | Chat turn has no tool state/retry/trace ownership. |
| `ToolRun` | Agent invokes named controlled tool | Tool events need isolated audit/authorization. |
| `TerminalRun` | Isolated server command execution approved | Terminal needs limits, output, cancel, security policy. |
| `WorkspaceArtifact` | Generated/mutated output requirement | Artifact != uploaded RAG document. |
| `ConversationSession` | Saved history/retention approved | Current turn intentionally ephemeral. |
| `ConversationTurn` | Session model approved | Requires ordering, access, deletion/export. |

No current schema gets optional `tool_call?: any` or `session_id?: string` “for later.”
