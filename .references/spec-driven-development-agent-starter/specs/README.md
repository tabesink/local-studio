# Specification System

Specifications here are concise, versioned, and connected. They are not a document graveyard.

## Status labels

Use one status at the top of every active specification:

- `draft` — incomplete; not implementation authority.
- `proposed` — ready for review; implementation may not start without explicit approval.
- `approved` — authoritative for implementation.
- `implemented` — code and evidence satisfy the document.
- `superseded` — replaced; link to successor.
- `archived` — historical context only.

## Required front matter

```yaml
---
id: F-001
title: Example feature
status: draft
owner: product-or-team
last_reviewed: YYYY-MM-DD
depends_on: []
supersedes: []
---
```

## Change rule

A meaningful behaviour change must update:
- the active feature specification;
- every affected contract;
- test/acceptance evidence;
- the traceability register;
- implementation code in the same delivery change when practical.

## Don’t create documentation theatre

A document earns its place only when it answers a recurring question, records a durable decision, governs a contract, or is required as proof. Delete or archive duplicate material.
