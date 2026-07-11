---
id: API-DOC-001
title: Admin document readiness v1
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Admin document readiness v1

## Purpose

Show existing Context Engine domain/source lifecycle state to admins. This is not Smart Composer’s vault-index command port.

## Proposed surface

```http
GET /api/v1/admin/domains/{domainId}/sources?limit=50&cursor=<opaque>
GET /api/v1/admin/domains/{domainId}/operations?limit=50&cursor=<opaque>
POST /api/v1/admin/domains/{domainId}/sources
POST /api/v1/admin/domains/{domainId}/sources/{sourceId}/retry
DELETE /api/v1/admin/domains/{domainId}/sources/{sourceId}
```

Use existing Context Engine lifecycle/ingestion contracts where already implemented; do not create parallel endpoint names merely for this UI.

## Required fields

`sourceId`, display title, status, submitted/updated timestamps, safe failure code/message, operation ID if applicable, and readiness eligibility.

## Source references

- source plugin’s user-facing index progress: `src/main.ts`, `src/components/chat-view/QueryProgress.tsx`.
- Do not transfer `RAGEngine.updateVaultIndex`; target indexing belongs to the API/worker.
