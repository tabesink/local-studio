---
id: DATA-CHG-001
title: Change proposal v1
status: draft
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Change proposal v1 — blocked

This contract is intentionally **draft**. Smart Composer’s apply path reads a local `TFile`, asks a model to rewrite it, and opens an Obsidian diff view. Context Engine has no approved editable-document ownership model.

Do not implement any API or UI until an approved decision answers:

1. Which source types are editable?
2. Who can propose versus apply a change?
3. How are source versions, locks, approval, conflict, rollback, and audit handled?
4. How is re-indexing triggered only after an approved apply?
5. Does applying changes preserve original raw source, canonical parse, and evidence history?

Possible future shape only:

```text
create proposal → generate bounded diff → review → approve/apply → version source → enqueue re-index
```

Direct filesystem writes are prohibited.
