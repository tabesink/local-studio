---
id: PROD-002
title: Domain Model
status: approved
owner: Context Engine domain team
last_reviewed: 2026-06-30
depends_on: [PROD-001, GOV-003]
supersedes: []
---

# Domain Model

## Bounded Contexts

| Context | Purpose | Owns | Consumes | Contracts |
| --- | --- | --- | --- | --- |
| Identity | users, roles, sessions | `users`, `auth_sessions` | none | API auth, data contract |
| Runtime Config | provider configs, model profiles, parser choice | `provider_configs`, `model_profiles`, `runtime_settings` | Identity | API settings, data contract |
| Domains | Knowledge Domain lifecycle and private runtimes | `domains`, `domain_operations` | Runtime Config | API domains, data contract |
| Sources | upload, preparation, canonical Source Blocks | `source_documents`, `source_preparation_operations`, `source_blocks`, `source_images` | Domains, Runtime Config | API sources, data contract |
| Indexing | LightRAG handoff/readiness/delete and query eligibility | `source_documents.index_*` fields | Sources, Domains, LightRAG | API source index, data contract |
| Retrieval | evidence retrieval and exact mapping | safe evidence DTOs | Indexing, LightRAG | API evidence, AI contract |
| Chat | conversations, turns, SSE, redaction | `conversations`, `conversation_turns` | Retrieval, Runtime Config | API chat, SSE, AI contract |
| Observability | audit, logs, optional trace metadata | `audit_events`, safe logs/traces | all protected actions | observability contract |
| Frontend | route rendering and interaction state | UI state only | API/SSE DTOs | F-009 UX and API contracts |

## Entity Summary

| Entity | Identifier | States | Owner |
| --- | --- | --- | --- |
| User | opaque user id | active/disabled via `is_active` | Identity |
| Auth Session | opaque session id/token hash | valid, expired, revoked | Identity |
| Provider Config | provider kind | configured/not configured | Runtime Config |
| Model Profile | profile id | active/referenceable; embedding immutable when domain uses it | Runtime Config |
| Knowledge Domain | public domain id plus private runtime identity | stopped, running, deleting | Domains |
| Domain Operation | operation id | queued/running/succeeded/failed/cancelled per operation contract | Domains/worker |
| Source Document | source id | pending, prepared, deleting | Sources |
| Source Preparation Operation | operation id | queued, running, succeeded, failed, cancelled | Sources/worker |
| Source Block | block id | immutable after publish until source delete | Sources |
| Source Index | fields on Source Document | not_requested, queued, submitting, accepted, ready, failed, cancelling, cancelled | Indexing |
| Conversation | conversation id | active container; owner-filtered | Chat |
| Turn | turn id | running, completed, failed, redacted | Chat |
| Audit Event | event id | immutable | Observability |

## Invariants

- Every Source Document belongs to exactly one Knowledge Domain.
- Every Turn records exactly one Knowledge Domain.
- Query eligibility is computed by one server function and is never copied into frontend logic.
- Evidence is not raw LightRAG output; it is mapped Source Block content after eligibility checks.
- Source/domain hard delete fences retrieval before remote/local cleanup and chat redaction.
