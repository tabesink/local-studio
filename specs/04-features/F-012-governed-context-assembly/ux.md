---
id: F-012-UX
title: Governed Context Assembly UX Contract
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-08
depends_on: [F-012, F-009]
supersedes: []
---

# F-012 - UX And State Contract

## Chat Workbench

`/chat` is a three-region workbench inside the authenticated shell and compact icon rail:

- Left: compact conversation list plus governed Sources, Evidence, Wiki, and Templates discovery.
- Center: active conversation timeline, running/terminal state, anchored composer, selected ref chips, safe errors, stop/retry affordances.
- Right: tabbed inspector with Evidence, Refs, Source, and Wiki panels only.

Desktop layouts at `>=1180px` show all three regions. Narrow layouts keep the center conversation/composer primary and expose left/right regions as drawers or tabs.

## Composer

- `@` opens composer ref discovery.
- Filters: Sources, Evidence, Wiki, Templates.
- `Enter` submits; `Shift+Enter` inserts newline; `Esc` closes picker.
- Pre-stream errors preserve editable message text and selected chips.
- Chips show kind, safe label, and removal control only; they never expose token strings, private ids, paths, source text, template bodies, prompt text, provider data, or raw runtime state.

## Visual Rules

Follow `DESIGN.md` and Local Studio visual parity: dark-first compact workstation, Geist typography, dense rows, restrained borders, tokenized tabs/chips/status rows, and no generic white dashboard.

Forbidden controls remain absent: attachments, terminal, filesystem, Git, browser automation, Pi session id, host path, model picker, provider controls, queue, steer, compact, plugin/skill controls, browser-side RAG, and raw prompt editor.
