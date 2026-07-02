---
type: guideline
status: active
audience:
  - agent
  - junior-dev
tags:
  - type/guideline
  - status/active
---

# Vault Conventions

The vault at `obsidian/` is a **learning and navigation layer**. `specs/` remains implementation authority.

## Start here

1. [[Context Engine Index]]
2. [[Build Order Index]] → current [[P4 Index]] (or active phase)
3. Phase readiness note → flows, tables, architecture as needed
4. [[Reviews Index]] only when tracing past decisions

## Layout

- Root: entry index notes only
- `Phases/` — one folder per build phase (P0–P9)
- `Architecture/` — cross-phase durable design
- `Reviews/` — post-impl ID-A and readiness packages
- `Prompts/` — reusable agent prompt kits
- `Guidelines/` — working conventions
- `Inbox/` — scratch; not durable knowledge
- `_Meta/`, `_templates/`, `_attachments/` — vault infrastructure

Max two folder levels. Navigate by **wikilinks**, not deep trees.

## Rules

- Title Case filenames; index notes end with `Index.md`
- One note = one idea; link up to phase index
- Footer every note with `## Repo sources` pointing at `specs/`
- Required frontmatter: `type`, `status`; add `phase`, `feature`, `spec`, `layer`, `tags` per [[Groups And Tags]]
- No secrets, paths, raw parser output, or provider payloads

Full rules: [[Obsidian Vault Setup Guidelines]] and `.devnotes/guidelines/obsidian-vault-setup-guidelines.md`

## Related

- [[Context Engine Index]]
- [[Note Types]]
- [[Groups And Tags]]
- [[Reading Rules]]
- [[Guidelines Index]]
