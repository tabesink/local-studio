# 20 — Local Studio Computer, Terminal, Browser Panes

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio frontend README lists terminal/browser panes and xterm.js. Agent workspace source loads computer/browser/canvas/status/filesystem/git/plan panels.

## Context Engine now

Context Engine has no controlled execution environment. No terminal/business need.

## UI/UX transfer

Reuse now: lazy right-panel loading pattern, panel headers, compact status, empty/loading states.

Do not reuse: xterm, command input, browser automation UI, computer tool pane.


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

None needed beyond documented future design. Do not add terminal route/model/UI placeholder.

## FUTURE ONLY — build gate

Trigger: approved controlled server execution requirement.

Future route example only:

```http
POST /api/v1/workspaces/{workspace_id}/terminal-runs
GET  /api/v1/terminal-runs/{run_id}
GET  /api/v1/terminal-runs/{run_id}/events
```

Requires isolated runner, allowlist, timeout, output cap, cancellation, audit, quota, admin policy.

## Security boundary

Terminal is high risk. Never `subprocess.run(user_input)` inside FastAPI route. No shared host shell.

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

`frontend/README.md`; `frontend/src/features/agent/ui/agent-workspace-shell.tsx`; `computer-tab-panel.tsx`; `frontend/src/features/agent/tools/`; Local Studio frontend dependencies include xterm.js.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
