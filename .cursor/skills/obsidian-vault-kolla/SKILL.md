---
name: obsidian-vault-kolla
description: Search, create, and manage notes in the Obsidian vault with wikilinks and index notes. Use when user wants to find, create, or organize notes in Obsidian — including lessons, code walkthroughs, and glossary terms.
---

# Obsidian Vault

## Vault location

`obsidian/` at the repo root

Start at the root index note (any top-level `* Index.md`) or `Vault Conventions.md` if present.

## Layout

Shallow folders (max two levels) + index notes + wikilinks:

```text
obsidian/
├── <Root> Index.md
├── Vault Conventions.md
├── _Meta/
├── _templates/
├── _attachments/
├── Architecture/
├── Phases/
├── Reviews/
├── Prompts/
├── Guidelines/
├── Inbox/
├── Ideation/
├── Lessons/
├── Code Walkthroughs/
└── Glossary/
```

Full rules (if present): `obsidian/Guidelines/Obsidian Vault Setup Guidelines.md`

## Folder intent

```text
Architecture/        Durable system design notes
Phases/              Phase-by-phase implementation notes
Reviews/             Codebase reviews, audits, critiques
Prompts/             Reusable prompts
Guidelines/          Rules, standards, conventions
Inbox/               Unprocessed scratch notes (not yet classified)
Ideation/            Brainstorms, ideation sessions, option trees, early design exploration
Lessons/             Interactive teaching notes, concepts, paper lessons, onboarding material
Code Walkthroughs/   Step-by-step source-code explanations
Glossary/            Definitions of important terms
```

## Ideation vs Inbox vs Architecture

- Put brainstorms, ideation sessions, and early option exploration in `Ideation/`
- Put unclassified scratch captures in `Inbox/` until you know the folder
- Promote settled design decisions out of `Ideation/` into `Architecture/` (or the relevant durable folder); do not leave decided ADRs/design only in Ideation

## Learning material rule

Do not create separate `Learning Paths/`, `Exercises/`, or `Research Papers/` folders.

Instead:

- Put teaching content in `Lessons/`
- Put code-specific walkthroughs in `Code Walkthroughs/`
- Put paper-based lessons in `Lessons/`
- Put exercises/checkpoints inside the lesson note itself
- Put definitions in `Glossary/`
- Put brainstorms / ideation in `Ideation/` (not Lessons, not Inbox)

Example:

```text
Ideation/Runnable Stack Workers Brainstorm.md
Ideation/Job Platform Options.md
Lessons/LightRAG Query Flow.md
Lessons/MeshGraphNets Paper Lesson.md
Lessons/RAG Evaluation Basics.md
Code Walkthroughs/Chat SSE Stream Walkthrough.md
Code Walkthroughs/Domain Creation API Walkthrough.md
Glossary/Vector Store.md
```

## Naming conventions

- **Title Case** for all note names
- Index notes end with `Index.md` (e.g. `Reviews Index.md`, `Lessons Index.md`)
- Topic notes live under the matching folder
- Prefer short, descriptive titles over coded prefixes unless the vault already uses them

## Linking

- Use Obsidian `[[wikilinks]]` syntax: `[[Note Title]]`
- Every note links up to its parent index
- Add `## Related` and `## Repo sources` footers when the note maps to repo paths
- Index notes are lists of `[[wikilinks]]`

## Workflows

### Search for notes

```bash
find obsidian/ -name "*.md" | grep -i "keyword"
grep -rl "keyword" obsidian/ --include="*.md"
find obsidian/ -name "*Index*"
```

### Create a new note

1. Pick folder by intent (see Folder intent above)
2. Use **Title Case** filename
3. One idea per note; YAML frontmatter per `Groups And Tags.md` when present: `type`, `status`, `tags` (plus any vault-specific fields)
4. Link up to the parent index; add `## Related` and `## Repo sources` as needed
5. Update the relevant `* Index.md`

### Create an ideation / brainstorm note

When the user asks for a brainstorm, ideation session, option tree, or early design exploration:

1. Create the note under `Ideation/`
2. Use **Title Case** filename; link up to `Ideation Index.md` (create the index if missing)
3. Prefer capturing options, trade-offs, open questions, and tentative conclusions — not settled architecture
4. Do not put ideation in `Inbox/` unless the user only wants a throwaway scratch capture
5. When a decision hardens, promote or link into `Architecture/` (or the relevant durable folder)

### Create a lesson / tutorial / paper explanation

When the user asks for a lesson, tutorial, junior-developer explanation, research-paper explanation, or interactive learning note:

1. Create the note under `Lessons/`
2. Include:
   - Goal
   - Why this matters
   - Mental model
   - Walkthrough
   - Checkpoint questions
   - Mini exercise
   - Expected answer
   - Common mistakes
   - Related notes
   - Repo sources, if applicable
3. Do not create a separate exercise note unless the user explicitly asks for one
4. Do not create a separate research-paper folder
5. Do not create a separate learning-path folder

For source-code step-throughs, use `Code Walkthroughs/` instead of `Lessons/`.
For term definitions, use `Glossary/`.

### Groups and tags

See `obsidian/_Meta/Groups And Tags.md` if it exists. Prefer nested tags such as `type/...`, `status/...`, `layer/...`.

### Find related notes

```bash
grep -rl "\\[\\[Note Title\\]\\]" obsidian/
```
