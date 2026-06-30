---
id: PROD-001
title: Product Brief
status: approved
owner: Context Engine product and delivery team
last_reviewed: 2026-06-30
depends_on: [GOV-001]
supersedes: []
---

# Product Brief

## Identity

- Product name: Context Engine
- Purpose: internal shared-workspace RAG workbench for administrator-curated Knowledge Domains, grounded answers, and traceable source evidence.
- Primary users: Members and Administrators.
- Business value: make trusted internal source knowledge queryable without exposing provider secrets, raw runtime internals, or ungrounded model answers.

## Product Boundary

Context Engine is:

- a domain-scoped RAG workbench;
- a source ingestion and indexing control plane;
- a grounded chat and evidence experience;
- an admin surface for users, runtime settings, domains, operations, and diagnostics.

Context Engine is not:

- a tenant platform;
- a generic document manager;
- a model playground;
- an unrestricted chatbot;
- an agent/tool/web-browse system;
- a plugin framework;
- a generic workflow engine.

## Primary Journeys

| Role | Journey | Observable result |
| --- | --- | --- |
| Member | Login -> app shell -> choose available Knowledge Domain -> ask question | grounded answer, evidence, or no-grounded-context result |
| Member | Documents/Graph/Source context | inspect allowed knowledge surfaces without raw private runtime access |
| Administrator | Settings -> providers/parsers/users/domains | safe configuration without secret leakage |
| Administrator | Documents -> upload -> preparation/index operations | Source Document reaches prepared/index-ready or safe failure |
| Administrator | Domain lifecycle -> start/stop/delete | private runtime lifecycle changes with operation evidence |
| Administrator | Operations/audit/diagnostics | safe troubleshooting metadata for internal pilot |

## Success Measures

- P1-P8 backend contracts can be proven by migrations, integration tests, OpenAPI snapshots, and end-to-end pilot flow.
- P9 UI consumes typed API/SSE contracts without browser credential persistence or direct runtime/provider access.
- Evidence and citations are exact, current, and authorized.
- Local Studio visual parity checks pass for core screens in dark and light mode.
