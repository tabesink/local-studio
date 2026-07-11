---
id: TRACE-001
title: Feature register
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Feature register

| Feature | Status | Depends on | Source reference | Target outcome |
|---|---|---|---|---|
| F-000 | proposed | — | source root / selected files | reproducible review baseline |
| F-001 | proposed | F-000 | ChatView | safe Next root/session bridge |
| F-002 | proposed | F-001 | Chat toolbar/shell | domain-scoped workspace |
| F-003 | proposed | F-002 | chat-input/mentionable | safe context tokens |
| F-004 | proposed | F-003 | useChatStreamManager | FastAPI SSE chat |
| F-005 | proposed | F-004 | evidence components | source navigation |
| F-006 | proposed | F-004,F-005 | ChatList/useChatHistory | server conversation history |
| F-007 | proposed | F-004 | template/metadata components | templates + safe metadata |
| F-008 | proposed | F-001,F-002 | main.ts/QueryProgress | admin source readiness |
| F-009 | proposed / blocked | F-005,F-006 | ApplyView/apply/diff | change proposal decision only |
| F-010 | proposed | F-001,F-004,F-005,F-008 | stream cancellation UX | pilot evidence |
