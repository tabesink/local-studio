---
id: PROD-002
title: Domain Model and Bounded Contexts
status: draft
owner: <domain owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [PROD-001, GOV-003]
supersedes: []
---

# Domain Model and Bounded Contexts

## Bounded contexts

| Context | Purpose | Owns | Does not own | Interfaces |
| --- | --- | --- | --- | --- |
| `<context>` | `<purpose>` | `<entities/rules>` | `<entities/rules>` | `<API/event/contracts>` |

## Core entities

| Entity | Definition | Identifier | Lifecycle states | Owning context |
| --- | --- | --- | --- | --- |
| `<entity>` | `<definition>` | `<id>` | `<states>` | `<context>` |

## Relationships

Describe important relationships and invariants.

```text
<entity A> 1 --- * <entity B>
```

## Invariants

- `<rule that must always remain true>`
- `<rule that constrains a state transition>`

## Ubiquitous language

Link terms to `specs/00-governance/glossary.md`. Do not introduce competing names here.
