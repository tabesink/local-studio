---
id: F-000
title: Shared Contract Specification
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: []
supersedes: []
---


# F-000 - Shared Contract

Phase: P0

## Outcome

Create one project spine for product vocabulary, boundaries, state ownership, contract precedence, and phase gates before coding starts.

## Why Now

The rebuild has backend, frontend, worker, runtime, retrieval, and AI behavior. P0 prevents drift before implementation work begins.

## Actors

Administrators, Members, coding agents, junior developers, reviewers, and tech leads.

## In Scope

- Adopt `CONTEXT.md`, `DESIGN.md`, governance, architecture, quality, and contract specs as active authority.
- Lock backend authority: Browser -> Context Engine API -> Postgres/storage/worker/controller/LightRAG/providers.
- Define one owner per concern and the P1-P9 build gates.
- Record forbidden scope: tenant platform, generic workflow engine, model playground, plugin runtime, unrestricted chatbot.

## Out Of Scope

- Application code
- database migrations
- browser UI
- runtime/provider calls
- mock product behavior

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Specs define source-of-truth precedence and reference-material status. | README.md, REFERENCES.md |
| FR-002 | Core vocabulary is canonical and avoids tenant/workspace ambiguity. | CONTEXT.md |
| FR-003 | Global rules forbid browser direct access to runtimes, providers, storage, DB, Docker, controller, and secrets. | GOV-001, ARCH-001 |
| FR-004 | Phase gates P1-P9 are traceable to feature folders. | TRACE-001 |

## Contracts And Data

- Contracts: All active specification documents
- Data: No application data. Specification metadata only.

## Acceptance Criteria

- AC-001: Placeholder scan excludes active docs except `_template`.
- AC-002: Feature register links resolve.
- AC-003: Conflicting source precedence is documented.

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.
