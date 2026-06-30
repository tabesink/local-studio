# Specification System

Specifications here are concise, versioned, and connected. They are the implementation authority for the Context Engine rebuild.

## Status Labels

- `draft`: incomplete; not implementation authority.
- `proposed`: ready for review; implementation should not start without explicit approval.
- `approved`: authoritative for implementation.
- `implemented`: code and evidence satisfy the document.
- `superseded`: replaced; link to successor.
- `archived`: historical context only.

## Required Front Matter

Every active specification uses YAML front matter with `id`, `title`, `status`, `owner`, `last_reviewed`, `depends_on`, and `supersedes`.

## Change Rule

A meaningful behavior change must update:

- the active feature specification;
- every affected API, SSE, data, or AI contract;
- test and acceptance evidence;
- the traceability register;
- implementation code in the same delivery change when practical.

## Read Order

1. `AGENTS.md`
2. `specs/00-governance/constitution.md`
3. `CONTEXT.md`
4. the relevant feature folder in `specs/04-features/`
5. touched contracts in `specs/03-contracts/`
6. architecture, quality, and delivery specs as needed

Do not create documentation theatre. A document earns its place only when it answers a recurring question, records a durable decision, governs a contract, or provides required proof.
