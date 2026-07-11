---
id: QA-005
title: AI Evaluation
status: approved
owner: Context Engine retrieval and chat team
last_reviewed: 2026-06-30
depends_on: [AI-001]
supersedes: []
---

# AI Evaluation

## Evaluation Dimensions

| Dimension | Requirement | Evidence |
| --- | --- | --- |
| Grounding | every answer claim is supported by current-turn Evidence | citation validation tests |
| Retrieval mapping | raw LightRAG hit maps by exact `CE_BLOCK` only | mapper fixture tests |
| No context | no grounded context returns safe non-answer state | API/SSE tests |
| Safety | no prompts/raw source/provider payload leak | snapshots/secret scan |
| Reliability | duplicate client request does not create a second provider call | idempotency test |
| Redaction | source/domain delete redacts derived content | integration test |
| Cost/latency | safe metadata captured when provider returns it | P8 trace/log review |
