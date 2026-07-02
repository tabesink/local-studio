---
id: TRACE-002
title: Requirement traceability matrix
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Traceability matrix

| Need | Feature | Contract | Test evidence | Source reference |
|---|---|---|---|---|
| Protected Next workspace | F-001 | CTR-000 | auth route/API test | `src/ChatView.tsx` composition only |
| Explicit current-domain scope | F-002 | API-EVD-001 | unauthorized domain test | `Chat.tsx` context selection concept |
| Safe context tokens | F-003 | API-EVD-001, API-CHAT-001 | stale search/domain-switch test | `types/mentionable.ts` |
| Server-owned streamed answer | F-004 | API-CHAT-001 | SSE/parser/idempotency test | `useChatStreamManager.ts` |
| Evidence navigation | F-005 | API-EVD-001 | citation/redaction test | `SimilaritySearchResults.tsx` |
| Durable user history | F-006 | API-CONV-001, DATA-CONV-001 | ownership/409/redaction tests | `useChatHistory.ts` |
| Templates and metadata | F-007 | template/turn metadata | ownership/leak test | `TemplateSectionModal.tsx` |
| Admin readiness UI | F-008 | API-DOC-001 | member/admin/poll-stop test | `QueryProgress.tsx` |
| Prevent unsafe apply port | F-009 | DATA-CHG-001 | static no-filesystem test | `ApplyView.tsx` |
| Pilot safety evidence | F-010 | CTR-000 | load/failure/runbook evidence | stream cancellation pattern |
