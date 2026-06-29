# 21 — Local Studio Filesystem, Git, Artifacts

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio agent file operations are local-only under `data/agentfs`. Agent UI includes filesystem and Git diff panels.

## Context Engine now

Context Engine documents are RAG source records. `source_path` is metadata. Context Engine must not expose host filesystem.

## UI/UX transfer

Reuse: hierarchical logical tree, file metadata monospace, inspector tabs, Git-style diff visual grammar later if artifact review becomes real.


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

Stable `document_id`, `chunk_id`, `asset_id`. Future artifact must be new entity. Do not reuse `Document` as writable file.

## FUTURE ONLY — build gate

Trigger: generated report/export/code/data artifact needs storage and review.

Future model:

```ts
type WorkspaceArtifact = {
  id: string;
  workspace_id: string;
  path: string;
  media_type: string;
  size_bytes: number;
  created_at: string;
  created_by: string;
  source_run_id?: string;
};
```

Do not create table now.

## Security boundary

Artifact access must be tenant/domain/workspace scoped. Never accept arbitrary host path. Never let user browse server root.

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

Local Studio `README.md` agent runtime section; `frontend/src/features/agent/ui/filesystem-panel.tsx`; `git-diff-panel.tsx`; Context Engine `app/api/routes/workspace_tree.py`, `app/api/routes/documents.py`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
