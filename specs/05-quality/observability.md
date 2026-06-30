---
id: QA-003
title: Observability
status: approved
owner: Context Engine operations team
last_reviewed: 2026-06-30
depends_on: [QA-002]
supersedes: []
---

# Observability

## Layers

| Layer | Purpose | Truth |
| --- | --- | --- |
| `audit_events` | security/admin accountability | audit truth |
| JSON stdout | runtime/operator diagnostics | diagnostic evidence |
| Optional Langfuse | RAG/LLM timing and metadata debug | never audit truth |

## Required Safe Log Fields

`timestamp`, `level`, `logger`, `event`, `request_id`, `trace_id`, `actor_kind`, `domain_id`, `source_id`, `conversation_turn_id`, `operation_id`, `safe_error_code`, `elapsed_ms`, `http_method`, `http_route`, `http_status`, `outcome`.

Do not log raw IP, raw user agent, raw body, filename/title/display name, secret, path, provider URL, provider track ID, stack trace, prompt, question, answer, source text, or raw evidence.
