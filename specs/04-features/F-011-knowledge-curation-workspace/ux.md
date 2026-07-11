---
id: F-011
title: Knowledge Curation Workspace UX Contract
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-07
depends_on: [F-011, DESIGN.md]
supersedes: []
---

# F-011 - UX And State Contract

## Surface

Smart Composer is the governed right-panel/workspace surface for Wiki Contributions. It uses Local Studio compact dark-first grammar and Context Engine API truth.

P11 UI is optional until backend DTOs exist. Do not ship UI controls whose backend route or DTO is not captured in API-001.

## Layout Intent

```text
left rail / existing P9 shell
  -> primary canvas:
       Wiki Page library or contribution review list
  -> right detail / composer panel:
       Smart Composer draft form
       contribution state
       selected safe evidence refs
       submit / publish / reject actions by role
```

## States

| State | UI treatment |
| --- | --- |
| draft | editable contribution body/title, save/update, submit action |
| submitted | read-only owner view; admin review actions visible only for Administrators |
| published | immutable revision summary and link to Wiki Page |
| rejected | safe reviewer note if present; no raw reviewer/private data |
| blocked | warning state explaining context is unavailable; no publish action |
| permission denied | compact forbidden state; backend authz remains final |
| conflict | compact error with safe request id if returned |

## Visual Rules

- Use existing shell, rail, table/list, tabs, right detail panel, modal, status dot/pill, and button grammar from DESIGN.md.
- Use tables/lists for pages and review queues, not card grids.
- Composer controls use compact 28px controls where possible and tokenized textarea/input surfaces.
- No gradients, oversized marketing headers, full-pill controls, or broad colored cards.
- Use Geist Mono for IDs, timestamps, route names, and request ids.

## Browser State Rules

Allowed:

- transient form state before save;
- selected panel/tab state;
- optimistic UI markers that are replaced by API truth.

Forbidden:

- durable draft truth in browser storage;
- tokens, prompts, source text, answer text, Evidence excerpts, raw API/SSE payload caches;
- provider, model, retrieval, runtime, Docker, storage, controller, or database targets.

## Reference Adaptation

Smart Composer reference material may inform:

- composer layout;
- selected context token presentation;
- evidence/citation compact rows;
- review/diff visual ideas after contracts exist.

Do not port Obsidian host/runtime, vault persistence, provider clients, OAuth, MCP, local RAG, or direct filesystem write/apply behavior.
