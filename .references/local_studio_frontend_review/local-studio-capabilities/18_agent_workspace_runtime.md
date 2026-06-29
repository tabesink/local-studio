# 18 — Local Studio Agent Workspace + Runtime

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio frontend hosts `/agent`, session navigation, Pi agent integration, skills/extensions, terminal/browser panes, and local file surfaces. Agent runtime runs through frontend runtime for normal turns.

## Context Engine now

Context Engine current query = RAG question -> evidence -> answer. No tool loop.

## UI/UX transfer

Reuse: workstation shell, chat pane density, composer, activity status, contextual side-panel loading.

Do not reuse: Pi runtime, tool registry, agent turn planner, session replay, tool events.


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

Keep `domain_id`, server `turn_id`, typed SSE parser. That is enough now. Future `AgentRun` is separate feature/model.

## FUTURE ONLY — build gate

Trigger: approved requirement needs multi-step tool calls.

Then add:

```text
AgentRun service
ToolRun service
agent authorization policy
AgentRun/ToolRun models
typed `agent.*` and `tool.*` SSE events
agent activity UI
audit + cancellation tests
```

## Security boundary

Agent tool execution can mutate files, call networks, access secrets. No generic agent in current RAG path.

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

`frontend/src/features/agent/`; `frontend/src/app/agent/`; `frontend/src/app/api/agent/`; current commit `fbc6f96` changes `agent-workspace-shell.tsx` and computer side panels.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
