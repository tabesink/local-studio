# P7 - Routed Streaming Chat

Status: PLANNED

## Context Packet

Build one user turn executor that routes each turn to either direct general chat or grounded RAG over P6 mapped evidence.

Read first: `docs/backend/p0-shared-contract.md`, `docs/backend/p7-grounded-chat-plan.md`.

## Previous Slice Provides

P6 provides exact mapped evidence, opaque source refs, source navigation, and current eligibility checks.

## This Slice Changes

- add `conversations` and `conversation_turns`;
- add `answer_kind = general | grounded`;
- add one-running-turn and idempotent client request guards;
- freeze active synthesis profile once per turn;
- build deterministic bounded routing catalog from eligible sources;
- classify direct vs RAG with uncertainty routed to RAG;
- implement direct general streaming with no retrieval/citations;
- implement single-shot RAG default;
- optionally implement controlled two-retrieval RAG via static server config;
- validate citations against current-turn evidence IDs;
- wire grounded-only redaction for source/domain delete.

## This Slice Must Not Rework

- no raw LightRAG hits to model/browser;
- no prior assistant answers in prompts;
- no browser route/model/retrieval/source controls;
- no LangGraph/agent framework/tool-calling/web search;
- no chat-memory vector DB;
- no citation history table;
- no new worker or queue.

## Next Slice Can Assume

P8 can observe turn lifecycle using safe metadata fields but must not alter chat behavior or request-path success.

## Acceptance Criteria

- direct chat performs zero retrieval, stores no citations, and is not redacted on domain delete.
- grounded chat uses P6 mapped evidence only.
- no evidence yields `no_grounded_context`.
- citation filter removes unknown/malformed IDs.
- duplicate client request returns existing turn.
- second running turn in same conversation returns conflict.
- source delete redacts cited grounded turns.
- domain delete redacts grounded turns only.
- SSE exposes only token, citations, done, and error events.
- response/log tests prove no prompts, raw question, raw answer, raw evidence, raw LightRAG payload, private IDs, source refs, paths, runtime URLs, or secrets leak.

