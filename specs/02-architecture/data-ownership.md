---
id: ARCH-003
title: Data Ownership
status: approved
owner: Context Engine data owner
last_reviewed: 2026-06-30
depends_on: [ARCH-001, PROD-002]
supersedes: []
---

# Data Ownership

| Data | System of record | Writers | Readers | Retention/delete | Class |
| --- | --- | --- | --- | --- | --- |
| Users/sessions | Postgres/API | auth/admin services | API/frontend via safe DTO | session expiry/revoke | confidential |
| Provider secrets | encrypted Postgres/API | runtime config admin service | resolver only | rotate/delete row ciphertext | restricted |
| Model/parser settings | Postgres/API | runtime config service | API/admin UI/resolver | retain current config | confidential |
| Domains | Postgres/API | domain service/worker | API/frontend | hard delete after runtime cleanup | confidential |
| Source originals | private storage | source service | worker only; no browser direct | delete with source/domain | restricted |
| Source Blocks | Postgres/API | preparation worker | retrieval/evidence services | delete with source/domain | restricted |
| LightRAG indexed content | private runtime | indexing worker | retrieval service | remote delete before local row removal when indexed | restricted |
| Conversations/turns | Postgres/API | chat service | owner via API | redaction after source/domain delete | confidential |
| Audit events | Postgres/API | audit service | admin audit route | immutable pilot record | confidential |
| Logs/traces | stdout/optional tracing | platform/services | operators | metadata only; no product truth | confidential |

## State Ownership Rules

- Domain state belongs to `domains` plus `domain_operations`.
- Source preparation state belongs to `source_documents` plus `source_preparation_operations`.
- Index state belongs to fields on `source_documents`, not a mirror table.
- Chat state belongs to `conversation_turns`, not query logs.
- Audit state belongs to `audit_events`, not logs or Langfuse.
