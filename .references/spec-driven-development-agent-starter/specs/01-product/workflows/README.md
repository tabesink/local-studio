# Business Workflow Specifications

Create one document per important, multi-step user or business workflow.

Suggested file name: `WF-###-short-name.md`.

Each workflow should include:
- trigger and actor;
- preconditions;
- primary path;
- alternate/exception paths;
- state changes and data ownership;
- emitted events and external calls;
- user-visible confirmations/errors;
- authorization and audit requirements;
- measurable completion outcome.

## Minimal template

```md
---
id: WF-001
title: <workflow>
status: draft
owner: <role>
last_reviewed: <YYYY-MM-DD>
---

# WF-001 — <workflow>

## Trigger
## Preconditions
## Primary flow
1.
2.
3.

## Exceptions and alternate paths
## State changes
## Contracts touched
## Acceptance checks
```
