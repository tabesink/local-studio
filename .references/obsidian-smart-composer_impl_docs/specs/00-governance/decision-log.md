---
id: GOV-004
title: Adaptation decisions
status: approved
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Decision log

| ID | Decision | Status | Reason |
|---|---|---|---|
| ADR-001 | Use Smart Composer only as UX/source reference. | approved | Avoid Obsidian/local-runtime coupling. |
| ADR-002 | FastAPI owns all model and retrieval operations. | approved | Prevent browser secrets and split business logic. |
| ADR-003 | Do not port MCP, provider OAuth, local provider keys, or vault scanning. | approved | Out of Context Engine product scope and increases risk. |
| ADR-004 | Persist conversation history server-side with per-turn domain. | proposed | Aligns target shared-workspace architecture; approve before F-006. |
| ADR-005 | Diff/apply stays disabled until Context Engine defines editable source ownership, locking, audit, and rollback. | approved | Smart Composer edits local files directly; target has no equivalent boundary yet. |
| ADR-006 | Source code uses commit-pinned links and MIT attribution. | approved | Makes reconstruction reproducible. |
