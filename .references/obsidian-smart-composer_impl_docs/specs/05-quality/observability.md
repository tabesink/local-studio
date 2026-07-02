---
id: Q-OBS-001
title: Observability
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Observability

## Minimum structured fields

```text
event, request_id, actor_kind, user_id_hash, domain_id, source_id,
conversation_turn_id, operation_id, safe_error_code, elapsed_ms
```

Do not log raw question, raw answer, raw source block, provider secret, session token, raw retriever response, Docker/runtime error, or filesystem path.

## Stream visibility

Record start, evidence-ready, completion, failure, cancellation, provider timeout/rate-limit, and client disconnect using safe identifiers only. Optional Langfuse traces must remain metadata-only and never become a runtime dependency.
