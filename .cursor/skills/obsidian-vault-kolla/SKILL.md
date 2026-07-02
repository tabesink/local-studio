---
name: obsidian-vault-kolla
description: Search, create, edit, and organize Context Engine notes in obsidian/ using wikilinks, index notes, YAML frontmatter, nested tags, and phase/feature groups. Use when finding vault notes, adding dev/architecture docs, promoting .devnotes, or tagging notes by phase, layer, or type.
---

# Obsidian Vault (Kolla)

Context Engine learning vault at `obsidian/`. **Not implementation authority** — `specs/` wins on conflict.

**Start:** `obsidian/Context Engine Index.md`  
**Full schema:** `obsidian/_Meta/Groups And Tags.md`  
**Conventions:** `obsidian/Guidelines/Obsidian Vault Setup Guidelines.md`

## Authority

| Source | Role |
| --- | --- |
| `specs/` | Implementation truth |
| `AGENTS.md` | Binding agent rules |
| `obsidian/` | Distilled notes, flows, tables, reviews |
| `.devnotes/` | Drafts — promote durable knowledge into vault |

## Layout

Max two folder levels. Navigate by **index notes + wikilinks + frontmatter/tags**.

```text
obsidian/
├── Context Engine Index.md    # root MOC
├── Build Order Index.md
├── Vault Conventions.md
├── _Meta/                     # Groups And Tags.md, Note Types.md
├── _templates/
├── Architecture/
├── Phases/                    # P0–P9
├── Reviews/
├── Prompts/
├── Guidelines/
└── Inbox/
```

## Groups and tags (required)

Every vault note **must** have YAML frontmatter. Properties drive structure; tags drive search and graph coloring.

### Frontmatter properties

| Property | Required | Values |
| --- | --- | --- |
| `type` | yes | `index`, `readiness`, `flow`, `table`, `architecture`, `implementation`, `review`, `id-a`, `prompt`, `guideline`, `scratch`, `meta` |
| `status` | yes | `draft`, `active`, `superseded`, `stub` |
| `phase` | when scoped | `P0` … `P9` |
| `feature` | when scoped | `F-000` … `F-009` |
| `spec` | when scoped | path under `specs/` |
| `layer` | optional | `api`, `data`, `worker`, `storage`, `lightrag`, `frontend`, `auth` |
| `contract` | optional | `DATA-001`, `API-001`, etc. |
| `audience` | optional | `agent`, `junior-dev`, `reviewer`, `lead` |
| `lifecycle` | optional | `planning`, `building`, `review`, `done` |
| `tags` | yes | nested tag list (see below) |

### Nested tags (in `tags:` list)

Always mirror key properties as tags:

| Tag prefix | Example | Mirror property |
| --- | --- | --- |
| `phase/` | `phase/p4` | `phase: P4` |
| `feature/` | `feature/f-004` | `feature: F-004` |
| `type/` | `type/flow` | `type: flow` |
| `status/` | `status/active` | `status: active` |
| `layer/` | `layer/storage` | each `layer` value |
| `review/` | `review/id-a` | review / ID-A notes |
| `contract/` | `contract/data` | contract family |
| standalone | `architecture` | cross-phase durable design |
| standalone | `open-question` | unresolved decision |

**Sync rule:** when editing `type`, `phase`, `status`, or `layer`, update matching tags in the same change.

### Minimal frontmatter template

```yaml
---
type: flow
phase: P4
feature: F-004
status: active
layer:
  - api
spec: specs/04-features/F-004-source-documents-preparation/spec.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p4
  - feature/f-004
  - type/flow
  - layer/api
  - status/active
---
```

Copy from `obsidian/_templates/Phase Note Template.md` when creating phase notes.

## Naming and linking

- **Title Case** filenames; index notes end with `Index.md`
- Phase notes → `Phases/<Phase Name>/`
- ID-A slices → `Reviews/` with `ID-A` prefix
- Use `[[wikilinks]]` only (not relative md links between vault notes)
- Every note links **up** to phase index (or `Reviews Index`)
- Footer: `## Repo sources` with `specs/` paths
- Body footer: `## Related` with wikilinks

## Workflows

### 1. Search for notes

Search by **content, filename, property, and tag** — not folders alone.

```bash
# By keyword in body
grep -rl "upload flow" obsidian/ --include="*.md"

# By filename
find obsidian/ -name "*.md" | grep -i "keyword"

# By tag (in frontmatter)
grep -rl "phase/p4" obsidian/ --include="*.md"
grep -rl "type/flow" obsidian/ --include="*.md"
grep -rl "layer/storage" obsidian/ --include="*.md"
grep -rl "architecture" obsidian/ --include="*.md"

# By property value
grep -rl "^phase: P4" obsidian/ --include="*.md"
grep -rl "^type: table" obsidian/ --include="*.md"
grep -rl "^status: stub" obsidian/ --include="*.md"

# All index notes
find obsidian/ -name "*Index*.md"

# Backlinks to a note
grep -rl "\\[\\[P4 Source Upload Flow\\]\\]" obsidian/
```

**Filter strategy:** combine tag + phase when scoping work, e.g. `phase/p4` + `type/flow`.

### 2. Create a new note

1. **Search first** — avoid duplicates (`grep -rl "topic" obsidian/`)
2. **Pick folder** from note type:

| `type` | Folder |
| --- | --- |
| `index`, `readiness`, `flow`, `table`, `architecture`, `implementation` | `Phases/<Phase>/` or `Architecture/` |
| `id-a`, `review` | `Reviews/` |
| `prompt` | `Prompts/` |
| `guideline` | `Guidelines/` |
| `scratch` | `Inbox/` |

3. **Title Case** filename; one idea per note
4. **Set frontmatter** — all required fields + synced tags
5. **Link up** to phase index; add `## Related` and `## Repo sources`
6. **Update** the relevant `* Index.md` with a `[[wikilink]]`

### 3. Edit or promote a note

When editing existing notes or promoting from `.devnotes/`:

1. Read authoritative `specs/` first — vault follows spec, not the reverse
2. Add or fix frontmatter if missing
3. Apply **sync rule** for properties ↔ tags
4. Set `status: superseded` on replaced notes; link to the canonical note
5. Update phase index and any review index
6. Log material deviations in spec `implementation-log.md`, not vault only

**Promotion map:**

| `.devnotes/` source | Vault destination |
| --- | --- |
| `P*-post-impl-REVIEW/ID-A*.md` | `Reviews/` |
| `P*-impl-SUMMARY.md` | `Phases/<Phase>/` as `implementation` type |
| `prompts/*.md` | `Prompts/` as `prompt` type |
| `guidelines/*.md` | `Guidelines/` as `guideline` type |
| scratch / todo | `Inbox/` as `scratch` type |

### 4. Verify tags after changes

Before finishing vault work, confirm:

- [ ] `type` and `status` set
- [ ] `phase` / `feature` / `spec` set when scoped
- [ ] `tags` include matching `type/`, `status/`, `phase/`, `feature/` entries
- [ ] `layer/*` tags match each `layer` value
- [ ] Phase index updated
- [ ] No secrets, storage paths, or raw provider payloads in note body

## Graph groups (Obsidian UI)

Configured in `obsidian/.obsidian/graph.json`:

| Query | Meaning |
| --- | --- |
| `path:Phases/P4` | P4 cluster |
| `path:Phases/P5` | P5 cluster |
| `path:Phases/P6` | P6 cluster |
| `path:Architecture` | Cross-phase architecture |
| `path:Reviews` | Post-impl reviews |
| `tag:#architecture` | Architecture-tagged notes |
| `path:Inbox` | Scratch |

Enable **Show tags** in graph view to see tag-linked nodes.

## Do / don't

**Do:** distill specs; keep atomic flow/table/architecture notes; tag consistently; point at `specs/` paths.

**Don't:** copy full spec trees; invent product behavior; file scratch outside `Inbox/`; nest folders deeper than `Phases/<Phase>/`; leave frontmatter or tags out of sync.
