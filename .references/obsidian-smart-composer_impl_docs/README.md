# Smart Composer → Next.js / Context Engine Adaptation Package

## Purpose

This package reverse-engineers **Obsidian Smart Composer** as a source and UX reference, then converts the reusable capabilities into small, testable **Next.js + Context Engine** vertical slices.

It is **not** a plan to port the Obsidian plugin runtime. Context Engine remains the system of record for identity, authorization, domains, documents, ingestion, retrieval, provider configuration, chat turns, operations, and audit state.

## Source freeze

| Item | Value |
|---|---|
| Source repository | `https://github.com/glowingjade/obsidian-smart-composer` |
| Reviewed ref | `main` at `6b38ab3c57e03c5c6cbeb79815277857df59cbd8` |
| Public release immediately before the reviewed head | `v1.2.9` (January 26, 2026) |
| Source licence | MIT; preserve required notices when copying source code |
| Review method | Static source inspection; no plugin runtime executed |

Use commit-pinned links in `SOURCE_PIN.md`. Re-audit before changing the source commit.

## How to use this package

1. Read `AGENTS.md` and `specs/00-governance/constitution.md`.
2. Read `specs/01-product/` and `specs/02-architecture/` before choosing a slice.
3. Confirm the **proposed** API contracts in `specs/03-contracts/` with the Context Engine backend owner.
4. Implement only one folder under `specs/04-features/` at a time.
5. Use `specs/07-traceability/source-feature-map.md` to inspect or copy the original MIT source as reference.

## Delivery order

```text
F-000 source freeze and decision gates
  → F-001 Next.js composition root and safe session bridge
  → F-002 workspace shell and domain scope
  → F-003 composer context tokens
  → F-004 grounded streamed chat
  → F-005 evidence/source navigation
  → F-006 conversation history
  → F-007 prompt templates and safe model metadata
  → F-008 admin document readiness surface
  → F-009 change-proposal review (only after explicit decision)
  → F-010 pilot hardening, observability, and load evidence
```

## Core rule

```text
Reuse Smart Composer interaction ideas and small presentational patterns.
Do not reuse its Obsidian host APIs, local vault persistence, direct provider calls,
local API-key handling, embedded OAuth details, local RAG ownership, MCP execution,
or direct filesystem write behaviour.
```

## Package limits

- Verified source facts are explicitly labelled **Verified source**.
- Target integration choices are labelled **Target decision** or **Proposed contract**.
- Runtime behaviours, visual parity, and uninspected paths are labelled **Requires runtime validation**.
- This package does not claim binary-equivalent reproduction of the plugin.
