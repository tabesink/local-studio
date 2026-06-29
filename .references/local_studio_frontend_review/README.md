# Context Engine × Local Studio
## Vertical Slice Documentation Package

## Purpose

Context Engine slice docs. Local Studio visual parity. FastAPI API boundary. Junior-dev readable. Smart caveman style.

This package follows requested slice order from supplied image. It adds separate Local Studio capability docs. Those are reference/future-gate docs. They do **not** create current scope.

## Package rules

```text
Context Engine remains RAG workbench.
Local Studio supplies UI grammar and selected future reference patterns.
FastAPI owns business truth.
Frontend owns view state.
Future compatibility != placeholder framework.
```

## Read first

- [00_read_first.md](00_read_first.md)
- [00_review_baseline.md](00_review_baseline.md)
- [00_visual_parity_and_ownership.md](00_visual_parity_and_ownership.md)
- [source-index.md](source-index.md)
- [Current API contract](contracts/01_current_context_engine_api.md)
- [Current SSE contract](contracts/02_current_sse_contract.md)
- [Future boundary](contracts/03_future_capability_boundary.md)
- [Data model catalog](contracts/04_data_model_catalog.md)

## Requested Context Engine vertical slices

- [01_runtime_foundation.md](vertical-slices/01_runtime_foundation.md) — Runtime Foundation
- [02_login_cookie_session.md](vertical-slices/02_login_cookie_session.md) — Login, Cookie, Session
- [03_app_shell_role_nav_empty_settings.md](vertical-slices/03_app_shell_role_nav_empty_settings.md) — App Shell, Role Nav, Empty State, Settings Entry
- [04_settings_general.md](vertical-slices/04_settings_general.md) — Settings: General
- [05_settings_users.md](vertical-slices/05_settings_users.md) — Settings: Users
- [06_settings_domains.md](vertical-slices/06_settings_domains.md) — Settings: Domains
- [07_settings_model_provider.md](vertical-slices/07_settings_model_provider.md) — Settings: Model Provider
- [08_settings_document_parser.md](vertical-slices/08_settings_document_parser.md) — Settings: Document Parser
- [09_documents_library.md](vertical-slices/09_documents_library.md) — Documents Library
- [10_document_upload_operations.md](vertical-slices/10_document_upload_operations.md) — Document Upload + Ingestion Operations
- [11_chat_route_shell.md](vertical-slices/11_chat_route_shell.md) — Chat Route Shell
- [12_chat_sse_evidence.md](vertical-slices/12_chat_sse_evidence.md) — Chat SSE + Evidence
- [13_knowledge_graph_workspace.md](vertical-slices/13_knowledge_graph_workspace.md) — Knowledge Graph Workspace
- [14_lightrag_domain_lifecycle.md](vertical-slices/14_lightrag_domain_lifecycle.md) — LightRAG Domain Lifecycle
- [15_operations_recovery.md](vertical-slices/15_operations_recovery.md) — Operations + Recovery
- [16_workspace_context_source_nav.md](vertical-slices/16_workspace_context_source_nav.md) — Workspace Context + Source Navigation
- [17_audit_diagnostics.md](vertical-slices/17_audit_diagnostics.md) — Audit + Diagnostics

## Separate Local Studio capability reference docs

- [18_agent_workspace_runtime.md](local-studio-capabilities/18_agent_workspace_runtime.md) — Local Studio Agent Workspace + Runtime
- [19_agent_sessions_history.md](local-studio-capabilities/19_agent_sessions_history.md) — Local Studio Agent Sessions + History
- [20_computer_terminal_browser_panes.md](local-studio-capabilities/20_computer_terminal_browser_panes.md) — Local Studio Computer, Terminal, Browser Panes
- [21_agent_filesystem_git_artifacts.md](local-studio-capabilities/21_agent_filesystem_git_artifacts.md) — Local Studio Filesystem, Git, Artifacts
- [22_model_runtime_recipes_downloads.md](local-studio-capabilities/22_model_runtime_recipes_downloads.md) — Local Studio Model Runtime, Recipes, Downloads
- [23_setup_runtime_target_discovery.md](local-studio-capabilities/23_setup_runtime_target_discovery.md) — Local Studio Setup + Runtime Target Discovery
- [24_proxy_openai_compat_audio.md](local-studio-capabilities/24_proxy_openai_compat_audio.md) — Local Studio Proxy, OpenAI Compatibility, Audio
- [25_usage_gpu_metrics_logs.md](local-studio-capabilities/25_usage_gpu_metrics_logs.md) — Local Studio Usage, GPU Metrics, Logs
- [26_plugins_skills_extensions.md](local-studio-capabilities/26_plugins_skills_extensions.md) — Local Studio Plugins, Skills, Extensions
- [27_desktop_cli_remote_controller.md](local-studio-capabilities/27_desktop_cli_remote_controller.md) — Local Studio Desktop, CLI, Remote Controller

## Diagrams

- [System context](diagrams/system-context.md)
- [Vertical slice delivery map](diagrams/vertical-slice-delivery-map.md)
- [Local Studio adoption map](diagrams/local-studio-adoption-map.md)

## Recommended implementation order

```text
01 runtime
-> 02 cookie session
-> 03 shell/nav/tokens
-> 06 domains + 07 providers + 08 parser
-> 09 library + 10 upload/jobs + 16 source nav
-> 11 chat shell + 12 SSE/evidence
-> 13 graph
-> 14 lifecycle + 15 recovery
-> 05 users + 17 audit
```

## Hard stop rules

```text
Do not create agent runtime now.
Do not create terminal now.
Do not create filesystem browser now.
Do not persist chat history now.
Do not copy Local Studio controller or Electron.
Do not store credentials in browser storage.
Do not add second API contract, SSE parser, or token system.
```

## Review baseline

See [00_review_baseline.md](00_review_baseline.md). Re-check repository SHA before implementation.
