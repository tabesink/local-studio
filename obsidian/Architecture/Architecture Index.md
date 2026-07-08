---
type: index
status: active
tags:
  - type/index
  - architecture
  - status/active
---

# Architecture Index

Cross-phase durable system design. Phase-scoped notes may also live under `Phases/` until promoted here.

## Trust and boundaries

- (stub) Trust Boundaries — browser vs backend vs LightRAG vs storage
- (stub) Session And Auth Model
- (stub) Knowledge Domain Runtime Model

## Storage and delivery

- [[P4 Private Storage Rules]] — private disk; no paths in API
- [[P4 Image Storage Architecture]] — blocks vs image bytes
- [[P6 Evidence And Asset Delivery]] — safe excerpts; source-ref gap

## Runtime and chat

- [[P2 Runtime Setup Flow]] — admin setup order
- [[P2 Model Profiles Table]] — synthesis, embedding, parser per operation
- [[P2 Provider Credentials Setup]] — encrypted provider secrets; admin-only
- [[TrustedRuntimeResolver]] — server-side credential + profile resolution
- [[F-012 Chat Workbench Layout]] — three-region `/chat` workbench

## Related

- [[Context Engine Index]]
- `specs/02-architecture/`
