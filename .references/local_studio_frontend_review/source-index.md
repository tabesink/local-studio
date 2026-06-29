# Source Index

## Context Engine source map

| Path | Why read | Slice use |
|---|---|---|
| `app/main.py` | FastAPI composition. Router registration. | 01, 02, 17 |
| `app/api/routes/auth.py` | Login/token/current-user behavior. | 02 |
| `app/api/routes/admin.py` | Admin-only operations/audit-adjacent behavior. | 03, 17 |
| `app/api/routes/users.py` | User management. | 05 |
| `app/api/routes/ai_settings.py` | Provider/model configuration. | 04, 07, 08 |
| `app/api/routes/documents.py` | Document list/upload/delete/detail. | 09, 10, 16 |
| `app/api/routes/jobs.py` | Background jobs. | 10, 15 |
| `app/api/routes/processing_status.py` | Pipeline state. | 10, 15 |
| `app/api/routes/retrieve.py` | Current RAG query boundary. | 11, 12 |
| `app/api/routes/lightrag.py` | LightRAG integration/graph-facing routes. | 13, 16 |
| `app/api/routes/lightrag_admin.py` | Domain lifecycle. | 06, 14, 15 |
| `app/api/routes/workspace_tree.py` | Source/navigation tree. | 16 |
| `app/schemas/*.py` | Public model shapes. | all API slices |
| `app/document_processing/` | Parser/pipeline domain. | 08, 09, 10 |
| `app/lightrag_deploy/` | Per-domain runtime/deploy. | 14, 15 |
| `app/retrieval/` | Evidence/retrieval mapping. | 11, 12, 16 |
| `app/workers/` | Queue worker and status poller. | 01, 10, 15 |
| `client/src/lib/api/client.ts` | Current browser token/API handling. | 02 |
| `client/src/lib/lightrag-client.ts` | Current query adapter. | 11, 12 |
| `client/src/stores/auth-store.ts` | Current auth UI state. | 02 |
| `client/src/stores/chat-session-store.ts` | Current client chat state. | 11, 12 |
| `client/src/stores/lightrag-domain-store.ts` | Domain selection state. | 03, 06, 14 |
| `client/src/app/chat/` | Current chat route. | 11, 12 |
| `client/src/app/settings/` | Current settings routes. | 04–08 |
| `client/src/app/database-visualize/` | Existing graph/database view route. | 13 |
| `client/src/components/layout/` | Shell/sidebar components. | 03 |
| `client/src/components/chat/` | Composer/chat components. | 11, 12 |
| `client/src/components/graph/`, `features/graph/` | Graph visual/client logic. | 13 |

## Local Studio source map

| Path | Why read | Transfer use |
|---|---|---|
| `frontend/src/app/styles/globals/tokens.css` | Theme, compact scale, surfaces. | All slice visual work |
| `frontend/src/lib/themes.ts` | Theme selection. | 03, 04 |
| `frontend/src/ui/` | Shared primitives. | All slice visual work |
| `frontend/src/features/shell/` | Dense rail/workstation layout. | 03 |
| `frontend/src/features/settings/` | Settings navigation/forms. | 04–08 |
| `frontend/src/features/agent/` | Composer/thread/inspector reference; future runtime reference. | 11, 12, 18–21, 26 |
| `frontend/src/features/usage/` | Usage surface. | 25 |
| `frontend/src/features/logs/` | Logs surface. | 17, 25 |
| `frontend/src/features/recipes/` | Runtime recipe UX. | 22 |
| `frontend/src/features/setup/` | Setup wizard UX. | 23 |
| `frontend/src/features/plugins/` | Plugin/extension surface. | 26 |
| `frontend/src/app/api/agent/` | Agent/session/browser routes. | 18–21 |
| `frontend/src/app/api/proxy/` | Controller proxy bridge. | 24 |
| `controller/src/modules/engines/` | Runtime lifecycle/recipes/downloads. | 22, 23 |
| `controller/src/modules/proxy/` | OpenAI-compatible proxy. | 24 |
| `controller/src/modules/system/` | Metrics/logs/usage/events. | 25 |
| `shared/contracts/` | Event/recipe/usage contract examples. | 22, 24, 25 |
| `desktop/`, `cli/` | Desktop/CLI control surfaces. | 27 |

## Evidence limit

Static source/docs only. No live Local Studio controller, Electron, agent, terminal, or Context Engine LightRAG run. Every `VERIFY` task matters.
