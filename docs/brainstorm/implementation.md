# Implementation Guide

This document records implemented scope, planned backlog, and the definition of done for coding agents.

## Current Implemented Scope

As of 2026-06-30, this repository contains planning and developer documentation only. There is no runtime application code, no migrations, no tests, and no package manager configuration yet.

Implemented documentation:

- root `README.md` project entry point;
- root `CONTEXT.md` product vocabulary;
- backend phase plans `P0` through `P8` in `docs/backend/`;
- canonical docs spine in `docs/`;
- PRD workspace and issue batons in `docs/brainstorm/context-engine-backend/`;
- task note `DOCS-001`;
- initial decision log and ADR seed.

## Planned Runtime Stack

The phase plans assume:

- Python FastAPI backend;
- PostgreSQL;
- SQLAlchemy and Alembic;
- opaque cookie sessions;
- encrypted provider configuration using Fernet;
- one worker process;
- private Docker-backed domain controller;
- one private LightRAG runtime per running domain;
- optional metadata-only tracing in P8.

If implementation chooses a different stack, record the decision in `docs/decisions/log.md`, create or update an ADR, and update the phase docs that depend on the stack.

## Backlog Summary

P1 builds the trusted empty API:

- app factory and composition root;
- Postgres migration `0001`;
- users and sessions;
- seed admin create-if-absent;
- login, logout, current-user, admin-user gate;
- request ID middleware and canonical error envelope.

P2 adds trusted runtime config:

- encrypted provider configs;
- model profiles;
- runtime settings singleton;
- active synthesis profile;
- active parser kind;
- private resolver.

P3 adds domain lifecycle:

- domains and domain operations;
- private controller;
- runtime naming policy;
- start, stop, status, async hard delete;
- member available-domain list.

P4 adds source preparation:

- source documents and preparation operations;
- immutable original storage;
- Docling and Reducto adapters;
- parser-neutral prepared blocks and images;
- worker claim loop;
- retry, cancel, local hard delete.

P5 adds LightRAG indexing:

- pinned LightRAG contract fixture;
- runtime secret injection;
- deterministic input rendering;
- index state fields;
- submit, readiness, cancel, retry, remote delete;
- query eligibility predicate.

P6 adds evidence retrieval:

- private LightRAG retrieve;
- exact block marker parsing;
- strict evidence mapping;
- opaque source and asset refs;
- focused source view;
- minimal member evidence UI if frontend exists.

P7 adds routed streaming chat:

- conversations and turns;
- one turn executor;
- bounded routing catalog;
- direct vs grounded classifier;
- single-shot RAG default;
- optional controlled two-retrieval RAG;
- provider streaming;
- citation validator;
- grounded-only redaction.

P8 adds observability:

- metadata-only structured trace events;
- masking choke point;
- safe metrics;
- failure-isolated exporter.

## Definition Of Done

A runtime task is done only when:

- behavior matches the phase acceptance criteria;
- public interfaces are documented;
- migrations run from a fresh database;
- tests cover the behavior through public interfaces;
- security and ownership rules are enforced at the boundary;
- typed errors use the canonical registry;
- logs are structured and safe;
- no browser-visible response leaks private IDs, paths, runtime URLs, provider config, raw payloads, prompts, source text, or secrets;
- `docs/master-build-plan.md`, task notes, and relevant architecture/deployment/test docs are updated;
- focused tests and checks were actually run, or skipped checks are documented with residual risk.

## Developer Rules Of Thumb

- Start from the phase issue baton and implementation map.
- Keep routes thin. Put use-case orchestration in services.
- Keep domain rules free of framework and vendor imports.
- Use repositories for SQL only.
- Use typed request/response models at API boundaries.
- Validate external input at the boundary.
- Never introduce a second owner for the same state.
- Prefer one direct service call over an event system until measured need proves otherwise.
- Avoid generic frameworks for jobs, operations, workflows, plugins, or retrieval strategies.

## Known Gaps

- No runtime files exist yet.
- No test commands exist yet.
- No migration tool is configured yet.
- P8 is a seed plan and needs expansion before build work.
- Frontend implementation details depend on future runtime project structure.
