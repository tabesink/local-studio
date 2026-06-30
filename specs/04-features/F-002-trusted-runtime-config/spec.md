---
id: F-002
title: Trusted Runtime Config Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-001]
supersedes: []
---


# F-002 - Trusted Runtime Config

Phase: P2

## Outcome

Create admin-only provider, model profile, parser, and runtime settings configuration with encrypted secrets and safe DTOs.

## Why Now

Domains and chat need trusted runtime choices, but browser clients must never see or own secrets.

## Actors

Administrators and backend runtime resolver.

## In Scope

- `provider_configs`, `model_profiles`, and `runtime_settings` singleton.
- Validate `CONFIG_ENCRYPTION_KEY` outside test.
- Fernet encryption boundary for OpenAI, Bedrock, and Reducto credentials.
- Closed provider policy: OpenAI, Bedrock, Ollama, Reducto.
- One active synthesis profile and one active parser kind.
- Embedding profiles require vector dimensions and are immutable once used by a domain.
- `TrustedRuntimeResolver` for private runtime configuration.
- Safe admin runtime-settings API.

## Out Of Scope

- provider SDK calls
- test connection route
- model discovery sync
- arbitrary base_url
- secret-name field
- generic JSON settings
- runtime files
- domain/runtime/source behavior

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Safe GET exposes `isConfigured` only, never secret/ciphertext. | API-001 |
| FR-002 | Active synthesis profile requires ready provider config. | API-001 |
| FR-003 | Embedding profile requires vector dimensions and cannot mutate/delete once a domain references it. | DATA-001 |
| FR-004 | Reducto can be parser provider but not a model profile provider. | PROD-003 |

## Contracts And Data

- Contracts: API-001, DATA-001, QA-002
- Data: `provider_configs`, `model_profiles`, `runtime_settings`; credentials encrypted only.

## Acceptance Criteria

- AC-001: missing/invalid encryption key fails startup outside test
- AC-002: provider rows seeded
- AC-003: credential rotation updates same row
- AC-004: safe GET excludes secret/ciphertext
- AC-005: Reducto parser requires Reducto credential
- AC-006: no provider network call happens

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.
