---
id: GOV-004
title: Decision Log
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [GOV-001]
supersedes: []
---

# Decision Log

| ID | Date | Decision | Reason | Affected specs | Owner | Review |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-001 | 2026-06-30 | Use opaque HttpOnly cookie sessions, not browser token persistence. | Eliminates localStorage bearer risk and makes logout server authoritative. | F-001, security, API | auth | before P1 complete |
| DEC-002 | 2026-06-30 | Keep pilot chat RAG-only. | Avoids ungrounded answer path and classifier bypass. | F-006, F-007, AI contract | product/backend | before P7 complete |
| DEC-003 | 2026-06-30 | Require exact `CE_BLOCK` evidence mapping. | Prevents approximate citations and unsafe provenance. | F-005, F-006, AI contract | retrieval | before P5 proof |
| DEC-004 | 2026-06-30 | Adopt Local Studio visual parity but not Local Studio runtime/product features. | Reuses proven visual system without importing agent/controller/Electron scope. | DESIGN, F-009 | design/frontend | before P9 shell |
| DEC-005 | 2026-06-30 | Use one worker process and resource-owned operation tables, not a generic workflow engine. | Keeps lifecycle ownership explicit and limits infrastructure. | F-003, F-004, F-005, F-008 | backend | before P3/P4 |
