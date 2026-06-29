# Source and Evidence Index

## Authority inputs

| ID | Source | Relevant evidence |
|---|---|---|
| A0 | `00-cross-phase-alignment.md` | Source precedence; browser/API boundary; resource-specific operation ownership; parser freeze; delete/redaction; RAG-only chat; runtime limits; P8 safe observability. |
| A1 | `development-scafold.md` | Product boundary, phase delivery scope, cross-phase validation, explicit deferrals. |
| B1 | `p1-trusted-application-foundation.md` | Opaque HttpOnly sessions; `/api/v1/auth/*`; typed errors; role authority. |
| B2 | `p2-admin-configs-runtime-settings.md` | One runtime settings singleton, known provider enum, safe config summaries, no arbitrary URL/secret names/provider call in P2. |
| B3 | `p3-knowledge-domains-runtime-lifecycle.md` | `stopped/running/deleting`; private controller; lifecycle actions; health/availability rules; hard delete. |
| B4 | `p4-source-documents-canonical-preparation.md` | Domain-scoped source documents, prep operations, flat blocks/images, admin API, no member source viewer. |
| B5 | `p5-lightRAG-indexing-query-eligibility.md` | Private LightRAG, source index state, eligibility, no browser LightRAG/no generic job system. |
| B6 | `p6-evidence-retrieval-source-navigation.md` | Safe mapped evidence only; no source navigation/source IDs/assets/source browser. |
| B7 | `p7-query-routing-chat.md` | Owned conversations, required domain per turn, RAG-only, canonical SSE draft/event vocabulary, redaction. |
| B8 | `p8-observability.md` | Audit events, structured logs, optional metadata-only Langfuse, safe diagnostics. |

## Frontend slice inputs

| ID | Source | Main wiring issue |
|---|---|---|
| F01 | `01_runtime_foundation.md` | Typed transport must become cookie-first. |
| F02 | `02_login_cookie_session.md` | Legacy route/token assumptions must align to P1. |
| F03 | `03_app_shell_role_nav_empty_settings.md` | Shell + Settings a11y; dark-first reconciliation. |
| F04 | `04_settings_general.md` | No fake persistence. |
| F05 | `05_settings_users.md` | CRUD assumed but backend deferred. |
| F06 | `06_settings_domains.md` | P3 contract capture and lifecycle handoff. |
| F07 | `07_settings_model_provider.md` | Legacy AI settings conflicts with P2. |
| F08 | `08_settings_document_parser.md` | Legacy parser profiles conflict with P2. |
| F09 | `09_documents_library.md` | Generic docs conflicts with P4 source boundary. |
| F10 | `10_document_upload_operations.md` | Generic operations conflicts with P4/P5 state ownership. |
| F11 | `11_chat_route_shell.md` | Capability route / optional domain conflicts with P7. |
| F12 | `12_chat_sse_evidence.md` | Legacy endpoint/event vocabulary conflicts with P7. |
| F13 | `13_knowledge_graph_workspace.md` | Graph proxy absent. |
| F14 | `14_lightrag_domain_lifecycle.md` | P3 action/status truth required. |
| F15 | `15_operations_recovery.md` | Generic operation endpoint conflicts with alignment. |
| F16 | `16_workspace_context_source_nav.md` | Source navigation ahead of P6. |
| F17 | `17_audit_diagnostics.md` | P8 safe audit/diagnostics is authoritative. |

## Reference code evidence

### Old Context Engine v1

| Path / area | Observed use | Treatment |
|---|---|---|
| `client/src/lib/api/client.ts` | localStorage bearer token + cookie credentials | Retain transport ideas only; remove token branch. |
| `client/src/lib/api/auth.ts` | token response + local logout | Replace with P1 cookie/session flow. |
| `client/src/components/layout/AppLayout.tsx` / rail | CE-specific navigation shell | Adapt to dark target. |
| `client/src/components/settings/SettingsDialog.tsx` | Dialog section/focus behavior | Adapt; tighten admin visibility. |
| `client/src/components/chat/LightRagChatShell.tsx` | Chat/evidence screen composition | Adapt only after P7 SSE fixture. |
| `client/src/components/chat/RetrievalSettingsPopover.tsx` | Browser retrieval controls | Reject. |
| `client/src/components/lightrag/LightRagDomainSelector.tsx` | Domain selection concept | Adapt to P3 available domains. |

### Local Studio

| Path / area | Observed use | Treatment |
|---|---|---|
| `frontend/src/app/layout.tsx` | dark theme + Geist/Geist Mono + root shell | Visual reference. |
| `frontend/src/app/*` | route error/loading/provider composition | Structural reference. |
| `frontend/src/features/shell/left-sidebar.tsx` | sidebar pattern | Visual/structural reference only. |
| `frontend/src/features/settings/*` | settings composition | Visual/structural reference only. |
| `frontend/src/ui/*` | modal/drawer/form/list/page-state/right-detail-panel primitives | Selective primitive adaptation after a11y/dependency review. |
| agent/terminal/filesystem/controller/runtime features | local workstation product | Reject for pilot. |

## Reference revision policy

Reference repositories were inspected as live code evidence. Before copying code, a coding agent must pin a specific commit SHA and record it in the PR. Do not claim behavior from an unpinned branch is a stable Context Engine contract.
