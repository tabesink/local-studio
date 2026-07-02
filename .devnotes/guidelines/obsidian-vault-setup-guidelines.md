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

# Obsidian Vault Setup Guidelines

Terse rules for coding agents and junior devs. The vault lives at `obsidian/`. It is a **learning and navigation layer** — not implementation authority.

## Authority

| Source | Role |
| --- | --- |
| `specs/` | Implementation truth. Change behavior here first. |
| `AGENTS.md` | Binding agent rules |
| `obsidian/` | Distilled notes, flows, tables, reviews, prompts |
| `.devnotes/` | Working drafts. Promote durable knowledge into `obsidian/` |

When vault and spec conflict, **spec wins**. Fix the vault or open a spec change — do not treat vault notes as contracts.

## Vault layout

Max **two folder levels**. Navigate by **index notes + wikilinks**, not deep folders.

```text
obsidian/
├── Context Engine Index.md       # start here
├── Build Order Index.md          # P0–P9 map
├── Vault Conventions.md
├── _Meta/                        # vault rules, reading order
├── _templates/                   # note templates
├── _attachments/                 # diagrams only
├── Architecture/                 # cross-phase durable design
├── Phases/                       # one folder per build phase
│   ├── P2 Trusted Runtime Config/
│   ├── P3 Knowledge Domains Runtime/
│   ├── P4 Source Documents Preparation/
│   └── …
├── Reviews/                      # post-impl ID-A + readiness packages
├── Prompts/                      # reusable agent prompt kits
├── Guidelines/                   # working conventions
└── Inbox/                        # scratch / todo — not durable knowledge
```

Root index notes stay at vault root. Phase content goes under `Phases/<Phase Name>/`.

## Note types

| Type | Where | Example |
| --- | --- | --- |
| Index / MOC | root or phase folder | `P4 Index.md` |
| Readiness | phase folder | `F-004 P4 Readiness` |
| Flow | phase folder | `P4 Source Upload Flow` |
| Table / entity | phase folder | `Source Blocks Table` |
| Architecture | `Architecture/` or phase | `Private Storage Rules` |
| Implementation summary | phase folder | `P4 Implementation Summary` |
| ID-A slice | `Reviews/` | `ID-A Parser Adapters` |
| Review gate | `Reviews/` | `F-004 P4 Reconciled Design Gates` |
| Prompt kit | `Prompts/` | `Phase Implementation Summary Prompt` |
| Scratch | `Inbox/` | `Todo.md` |

One note = one idea. Split notes longer than ~700 words or with unrelated H2 sections.

## Naming and files

- **Title Case** filenames: `P4 Source Upload Flow.md`
- Index notes end with `Index.md`
- ID-A slices keep `ID-A` prefix
- Use `[[wikilinks]]` — not relative markdown links between vault notes
- Required frontmatter: `type`, `status`; optional `phase`, `feature`, `spec`, `layer`, `contract`, `audience`, `lifecycle`, `tags` — see [[Groups And Tags]]

## Groups and tags

Properties (frontmatter):

| Property | Values |
| --- | --- |
| `type` | `index`, `readiness`, `flow`, `table`, `architecture`, `implementation`, `review`, `id-a`, `prompt`, `guideline`, `scratch`, `meta` |
| `phase` | `P0` … `P9` |
| `feature` | `F-000` … `F-009` |
| `status` | `draft`, `active`, `superseded`, `stub` |
| `layer` | `api`, `data`, `worker`, `storage`, `lightrag`, `frontend`, `auth` |
| `lifecycle` | `planning`, `building`, `review`, `done` |

Nested tags (in `tags:` list): `#phase/p4`, `#feature/f-004`, `#type/flow`, `#layer/storage`, `#status/active`, `#review/id-a`, `#contract/data`, `#architecture`, `#open-question`

Full schema: `obsidian/_Meta/Groups And Tags.md`

## Linking rules

1. Every note links **up** to its phase index (or `Reviews Index`).
2. Every note has a **Repo sources** footer with authoritative `specs/` paths.
3. Reviews explain *why*; phase/architecture notes hold *durable* design.
4. Cross-phase topics get one canonical note + wikilinks — no duplicates.
5. Link related notes at the bottom under `## Related`.

## Read order

1. `obsidian/Context Engine Index.md`
2. `obsidian/Build Order Index.md` → current phase index
3. Phase **Readiness** note
4. Flow / table / architecture notes as needed
5. **Reviews** only when tracing a past decision
6. Authoritative spec from the note footer

Mirrors `AGENTS.md` read order, optimized for learning.

## Do / don't

**Do**

- Distill specs and impl into scannable notes
- Keep tables, flows, and resolvers as atomic leaf notes
- Update the phase index when adding a note
- Point to `specs/04-features/F-###-…/` instead of copying full specs

**Don't**

- Copy entire spec trees into the vault
- Store secrets, raw parser output, storage paths, provider payloads, or stack traces
- Invent product behavior in vault notes
- File scratch notes outside `Inbox/`
- Nest folders deeper than `Phases/<Phase>/`

---

## For coding agents

- Read `AGENTS.md` and relevant `specs/` **before** editing vault notes.
- Create or update vault notes **after** spec/contract changes when behavior is new or non-obvious.
- Prefer editing an existing note over creating a near-duplicate. Search first:

```bash
grep -rl "keyword" obsidian/ --include="*.md"
find obsidian/ -name "*Index*"
```

- When finishing a phase slice: add/update **Implementation Summary**, link from phase index, log deviations in spec `implementation-log.md` — not only in vault.
- Prompt kits go in `Prompts/`. Durable conventions go in `Guidelines/`. Time-bound review output goes in `Reviews/`.
- Required footer on new notes:

```markdown
## Repo sources

- `specs/04-features/F-###-…/spec.md`
- (other contracts or logs as needed)
```

- Set frontmatter per [[Groups And Tags]]; mirror key fields with nested tags for graph/search

## For junior devs

- Start at `Context Engine Index.md`, then open the phase you are building (e.g. `Phases/P4 Source Documents Preparation/P4 Index.md`).
- Read **Readiness** first — it lists blockers, acceptance criteria, and build order.
- Use **ID-A** notes in `Reviews/` as slice explainers; they map to tasks, not contracts.
- Use **Flow** and **Table** notes to trace request → DB → storage → worker without reading the whole codebase.
- If a note and a spec disagree, ask — do not implement from the vault alone.
- When you learn something durable (a flow, a table shape, a resolver rule), ask to promote it from `.devnotes/` or your scratch notes into `obsidian/` under the right phase folder.
- Keep personal todos in `Inbox/Todo.md` or `.devnotes/todo.md` until they become a real note or a spec task.
