---
type: meta
status: active
tags:
  - type/meta
  - status/active
---

# Groups And Tags

Canonical grouping schema for this vault. Use **frontmatter** for structure; use **nested tags** for cross-phase search and graph coloring.

## Frontmatter properties

| Property | Required | Values |
| --- | --- | --- |
| `type` | yes | `index`, `readiness`, `flow`, `table`, `architecture`, `implementation`, `review`, `id-a`, `prompt`, `guideline`, `scratch`, `meta` |
| `phase` | when scoped | `P0` … `P9` |
| `feature` | when scoped | `F-000` … `F-009` |
| `status` | yes | `draft`, `active`, `superseded`, `stub` |
| `spec` | when scoped | path under `specs/` |
| `layer` | optional | `api`, `data`, `worker`, `storage`, `lightrag`, `frontend`, `auth` (string or list) |
| `contract` | optional | e.g. `DATA-001`, `API-001` |
| `audience` | optional | `agent`, `junior-dev`, `reviewer`, `lead` (string or list) |
| `lifecycle` | optional | `planning`, `building`, `review`, `done` |
| `tags` | optional | nested tags (see below) |

## Nested tags

Use Obsidian nested tags in frontmatter `tags:` list.

| Prefix | Example | When to use |
| --- | --- | --- |
| `#phase/` | `#phase/p4` | Note belongs to a build phase |
| `#feature/` | `#feature/f-004` | Maps to F-### feature folder |
| `#type/` | `#type/flow` | Mirrors `type` property |
| `#layer/` | `#layer/storage` | Stack layer (repeat per layer) |
| `#status/` | `#status/active` | Mirrors `status` property |
| `#review/` | `#review/id-a` | Review package or ID-A slice |
| `#contract/` | `#contract/data` | Contract family |
| `#architecture` | `#architecture` | Cross-phase durable design |
| `#open-question` | `#open-question` | Unresolved decision |

**Rule:** set `type`/`phase`/`status` in properties; add matching `#type/`, `#phase/`, `#status/` tags when useful for graph/search. Add `#architecture` or `#review` only for cross-cutting notes.

## Graph color groups

Configured in `.obsidian/graph.json`:

| Color | Query | Meaning |
| --- | --- | --- |
| Red | `path:Phases/P4` | P4 cluster |
| Orange | `path:Phases/P5` | P5 cluster |
| Yellow | `path:Phases/P6` | P6 cluster |
| Green | `path:Architecture` | Cross-phase architecture |
| Blue | `path:Reviews` | Post-impl reviews |
| Purple | `tag:#architecture` | Architecture-tagged notes |
| Gray | `path:Inbox` | Scratch |

## Examples

**Flow note:**

```yaml
---
type: flow
phase: P4
feature: F-004
status: active
layer:
  - api
  - worker
audience: junior-dev
lifecycle: done
spec: specs/04-features/F-004-source-documents-preparation/spec.md
tags:
  - phase/p4
  - feature/f-004
  - type/flow
  - layer/api
  - layer/worker
  - status/active
---
```

**Review index:**

```yaml
---
type: index
phase: P3
feature: F-004
status: stub
audience: reviewer
lifecycle: review
tags:
  - phase/p3
  - feature/f-004
  - type/index
  - review/id-a
  - status/stub
---
```

## Related

- [[Note Types]]
- [[Vault Conventions]]
- [[Obsidian Vault Setup Guidelines]]
