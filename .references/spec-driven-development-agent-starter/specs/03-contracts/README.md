---
id: CON-000
title: Contract Conventions
status: draft
owner: <engineering lead>
last_reviewed: <YYYY-MM-DD>
depends_on: [GOV-001, GOV-002]
supersedes: []
---

# Contract Conventions

Contracts are boundary agreements, not implementation notes.

## Contract classes

- **API contract:** HTTP/RPC request, response, error, authentication, pagination, and rate-limit behaviour.
- **Event contract:** Event name, schema, version, producer, consumer expectation, delivery semantics, ordering, and idempotency.
- **Data contract:** Persistent schema, ownership, validation, migration, retention, and access.
- **AI contract:** User intent, input/output schema, grounding, allowed tools/data, guardrails, evaluation, cost limits, and failure behaviour.

## Compatibility policy

Default to additive, backward-compatible changes:
- add optional fields;
- accept old and new versions during migration;
- never repurpose an existing field with a new meaning;
- document deprecation, migration, and removal date for breaking changes;
- use a new contract version where consumer coordination is not guaranteed.

## Contract quality gate

A contract is ready when it has:
- named owner and status;
- request/input and response/output schemas;
- validation rules and error behaviour;
- authorization and data-classification statement;
- compatibility/versioning statement;
- test/consumer evidence;
- linked features and architecture docs.
