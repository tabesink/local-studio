---
name: obsidian-vault
description: Search, create, and manage notes in the Obsidian vault with wikilinks and index notes. Use when user wants to find, create, or organize notes in Obsidian.
---

# Obsidian Vault

## Vault location

`obsidian/` at the repo root

Start at [[Context Engine Index]] (file: `obsidian/Context Engine Index.md`).

## Layout

Shallow folders (max two levels) + index notes + wikilinks:

```text
obsidian/
├── Context Engine Index.md
├── Build Order Index.md
├── Vault Conventions.md
├── _Meta/
├── _templates/
├── _attachments/
├── Architecture/
├── Phases/          # P0–P9, one folder per phase
├── Reviews/
├── Prompts/
├── Guidelines/
└── Inbox/
```

Full rules: `obsidian/Guidelines/Obsidian Vault Setup Guidelines.md`

## Naming conventions

- **Title Case** for all note names
- Index notes end with `Index.md` (e.g. `P4 Index.md`)
- Phase notes live under `Phases/<Phase Name>/`
- ID-A slices use `ID-A` prefix in `Reviews/`

## Linking

- Use Obsidian `[[wikilinks]]` syntax: `[[Note Title]]`
- Every note links up to its phase index (or `Reviews Index`)
- Add `## Repo sources` footer pointing at `specs/` paths
- Index notes are lists of `[[wikilinks]]`

## Workflows

### Search for notes

```bash
find obsidian/ -name "*.md" | grep -i "keyword"
grep -rl "keyword" obsidian/ --include="*.md"
find obsidian/ -name "*Index*"
```

### Create a new note

1. Pick folder: `Phases/`, `Architecture/`, `Reviews/`, `Prompts/`, or `Guidelines/`
2. Use **Title Case** filename
3. One idea per note; YAML frontmatter per `Groups And Tags.md`: `type`, `status`, `phase`, `feature`, `spec`, `layer`, `tags`
4. Link up to phase index; add `## Related` and `## Repo sources`
5. Update the relevant `* Index.md`

### Groups and tags

See `obsidian/_Meta/Groups And Tags.md`. Use nested tags: `phase/p4`, `feature/f-004`, `type/flow`, `layer/storage`, `status/active`, `review/id-a`, `architecture`.

### Find related notes

```bash
grep -rl "\\[\\[Note Title\\]\\]" obsidian/
```
