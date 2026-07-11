---
id: Q-UI-001
title: UI and accessibility
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# UI and accessibility

- Use existing Next.js design system/shadcn primitives rather than copying Obsidian CSS globally.
- Capture source visual behaviour from a running reference before parity claims.
- Composer, source token menu, history list, dialogs, evidence drawer, and stop button must be keyboard operable.
- Focus returns to a predictable trigger after dialog close; escape closes only non-destructive UI.
- Status changes use accessible live regions without announcing every streamed token.
- Markdown/citations must be sanitized and readable without colour-only meaning.
