# 19 — Local Studio Agent Sessions + History

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio agent workspace includes session navigation and persisted active agent sessions. Current source references session IDs and workspace store.

## Context Engine now

Context Engine current chat turn is ephemeral. Client-generated conversation ID must not become implicit durable history.

## UI/UX transfer

Reuse: session-list visual density only after product requirement exists. Reuse compact rail/list/detail pattern.


## Local Studio visual transfer

| Element | Use |
|---|---|
| Shell | Left rail. Center canvas. Optional right detail panel. |
| Density | `24px` small rows. `28px` controls/standard rows where primitive supports it. |
| Type | Geist for UI/body. Geist Mono for IDs, paths, model names, durations, payloads. |
| Surfaces | Dark-first close charcoal layers. 1px quiet borders. No card grid. |
| Actions | White/black high-contrast primary. Quiet danger. Compact icon/ghost secondary. |
| State | `StatusDot`/`StatusPill`; thin progress; compact error box. |
| Detail | Inspector stays in context. Do not route away for a small inspection. |


## Compatibility seam now

Keep opaque server `turn_id`; stable citation/document/chunk IDs. Do not add session table/route/nav now.

## FUTURE ONLY — build gate

Trigger: user needs saved query history, replay, sharing, retention, delete/export.

Then decide:

```text
ConversationSession ownership
ConversationTurn ordering
retention policy
per-domain access
redaction/export
delete behavior
model/profile snapshot
```

## Security boundary

History may contain sensitive questions/evidence. Retention is product/legal decision, not UI convenience.

## Do not build now

```text
No placeholder route.
No placeholder model/table.
No empty feature folder.
No generic plugin/agent adapter.
No Local Studio runtime import.
No navigation item.
```

## Decision checklist

| Question | Required answer before implementation |
|---|---|
| User problem | Exact user workflow. |
| Owner | FastAPI service/runtime owner. |
| Scope | Domain, tenant, workspace, or global. |
| Permission | Role/capability rule. |
| Data | New model vs current model. |
| Security | Threats, isolation, audit. |
| Stream | Exact typed events or none. |
| Operations | Timeout, retry, cancel, retention. |
| Tests | API, security, integration, UI. |


## Source evidence

`frontend/src/features/agent/workspace/`; `frontend/src/features/agent/runtime/types`; `agent-workspace-shell.tsx`; Context Engine `client/src/stores/chat-session-store.ts`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
