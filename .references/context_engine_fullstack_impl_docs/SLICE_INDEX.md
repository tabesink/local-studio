# Slice Index

| # | File | User outcome | Depends |
|---:|---|---|---|
| 01 | `01_runtime_foundation.md` | app boots with typed config/API/error surface | none |
| 02 | `02_login_cookie_session.md` | user signs in/out; protected routes resolve safely | 01 |
| 03 | `03_app_shell_role_nav_empty_settings.md` | authenticated shell, role nav, empty Settings dialog | 02 |
| 04 | `04_settings_general.md` | user edits general settings UI | 03 |
| 05 | `05_settings_users.md` | admin manages users | 03 |
| 06 | `06_settings_domains.md` | admin sees/configures domain surface | 03 |
| 07 | `07_settings_model_provider.md` | admin manages model profiles without secret leak | 03 |
| 08 | `08_settings_document_parser.md` | admin manages parser profiles/test | 03 |
| 09 | `09_documents_library.md` | user browses document status | 03 |
| 10 | `10_document_upload_operations.md` | admin uploads/tracks async processing | 09 |
| 11 | `11_chat_route_shell.md` | user writes/submits question shell | 03 |
| 12 | `12_chat_sse_evidence.md` | streamed answer/evidence/failure handling | 11 |
| 13 | `13_knowledge_graph_workspace.md` | user inspects graph workspace | 03, 09 |
| 14 | `14_lightrag_domain_lifecycle.md` | admin runs domain lifecycle | 06, 15 |
| 15 | `15_operations_recovery.md` | admin tracks/retries/cancels operations | 10 |
| 16 | `16_workspace_context_source_nav.md` | user navigates evidence/source context | 09, 12 |
| 17 | `17_audit_diagnostics.md` | admin investigates safe diagnostics | 15 |
