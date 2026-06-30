---
id: GOV-001
title: Project Constitution
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: []
supersedes: []
---

# Project Constitution

## Purpose

This constitution constrains the greenfield Context Engine rebuild. It prevents product drift, hidden security shortcuts, overbuilt infrastructure, and UI divergence from Local Studio visual parity.

## Non-Negotiable Principles

### 1. Product behavior before mechanism

State the user outcome, acceptance criteria, and data ownership before choosing frameworks, providers, queues, models, or UI abstractions.

### 2. One owner per concern

Each lifecycle, state machine, secret, prompt, evidence mapping, and contract has one owner. Do not mirror or fork truth across UI, API, worker, or LightRAG.

### 3. Backend authority

FastAPI owns identity, sessions, authorization, provider/parser secrets, Knowledge Domain lifecycle, Source Document lifecycle, indexing, query eligibility, evidence mapping, chat turns, redaction, and audit.

### 4. Browser is thin

The browser renders API truth. It never accesses LightRAG, Docker, storage paths, database, providers, runtime URLs, controller routes, Langfuse, secrets, or raw retrieval/provider payloads.

### 5. Secure and private by default

Use opaque HttpOnly cookie sessions. Never persist tokens in browser storage. Never expose secrets, raw source text, prompts, raw answers, raw LightRAG hits, provider payloads, stack traces, runtime URLs, or storage paths.

### 6. KISS and YAGNI

Do not add a generic workflow engine, event bus, Redis/RQ/Celery, WebSocket migration, plugin framework, broad state manager, local retrieval fallback, second vector store, or extensibility layer unless an approved feature requires it now.

### 7. Exact evidence, no approximation

Evidence shown to users must map from exact `CE_BLOCK` identity to an eligible Source Block. No fuzzy or nearest-match evidence mapping is allowed for the pilot.

### 8. Contracts are products

HTTP, SSE, data, and AI behavior must be versioned, tested, and linked to features. Unknown contract shape means capture OpenAPI/runtime fixtures first.

### 9. Local Studio visual parity

Frontend implementation must preserve Local Studio's compact dark-first workstation grammar while using old Context Engine route/layout structure where appropriate.

### 10. Tests are delivery evidence

Every acceptance criterion must name proof: unit, integration, migration, OpenAPI snapshot, SSE fixture, browser/e2e, visual check, load test, or manual review.

## Required Practices

- Branch/PR naming: `<feature-id>-short-name`.
- Each meaningful code change names a feature ID.
- Feature docs, code, tests, traceability, and affected contracts move together.
- Every exception is recorded in `specs/00-governance/decision-log.md` or an ADR under `specs/02-architecture/decisions/`.
- Work one vertical slice at a time and stop at that slice's acceptance gate.
