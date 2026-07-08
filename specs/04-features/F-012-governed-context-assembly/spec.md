---
id: F-012
title: Governed Context Assembly Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-08
depends_on: [F-007, F-009, F-011]
supersedes: []
---

# F-012 - Governed Context Assembly

Phase: P12

## Outcome

Members can compose chat turns with backend-issued opaque composer refs for Sources, Evidence, Wiki Pages, and approved prompt templates. FastAPI validates every ref, assembles private prompt context through `PromptAssemblyService`, then runs the existing P7 turn path and projects only safe accepted-ref metadata in history and terminal SSE state.

F-012 also updates `/chat` from the earlier two-column placeholder direction to a three-region Local Studio-parity workbench: left governed discovery, center conversation/composer, and right Evidence/Refs/Source/Wiki inspector.

## In Scope

- `composerRefTokens` on the existing `POST /conversations/{conversation_id}/turns:stream` request.
- `POST /composer-refs:discover` for backend-owned safe discovery.
- Backend-owned prompt-template catalog records selected by template refs.
- Opaque composer ref tokens stored as server-side token hashes, never browser-constructed from private ids.
- Source, Evidence, Wiki, and Template ref validation before turn claim and before prompt assembly.
- Server-owned `PromptAssemblyService` with bounded private assembly context.
- Accepted-ref persistence on turns and safe `acceptedRefs` projection in conversation history and terminal/replay SSE `done`.
- Three-region `/chat` workbench using typed CE API/SSE wrappers and Local Studio visual parity.

## Out Of Scope

- Attachments, queue/steer/follow-up, compaction, member model choice, multi-pane comparison, pin/archive/export, plugin loading, browser-side RAG, or source filesystem navigation.
- Browser-owned prompt editing, template bodies, provider/model/retrieval controls, tool choice, host paths, runtime URLs, terminal/filesystem/Git/browser panels, Pi frames, JSONL session authority, or Local Studio runtime semantics.
- Template authoring UI or Smart Composer AI assist in this slice.

## Functional Requirements

| ID | Requirement | Source | Verification |
| --- | --- | --- | --- |
| FR-001 | A turn may include zero or more `composerRefTokens` with the existing message, optional domain, and client request id semantics. | API-001 | route tests |
| FR-002 | Composer refs are opaque backend-issued tokens; browser code never constructs refs from paths, raw ids, source text, prompt text, provider state, or host filesystem state. | API-001, QA-002 | API/frontend scans |
| FR-003 | Valid ref kinds are `source`, `evidence`, `wiki`, and `template`. Source, Evidence, and Wiki refs require a selected Knowledge Domain; template-only direct LLM remains allowed without a domain. | API-001, AI-001 | validation tests |
| FR-004 | Ref validation checks existence, caller authorization, effective-domain compatibility, query eligibility, redaction/delete invalidation, template approval, and kind-specific rules before turn claim. | API-001, DATA-001 | service tests |
| FR-005 | Invalid refs fail closed with a pre-stream JSON error. Silent partial dropping is not allowed. | API-001 | route tests |
| FR-006 | Duplicate `clientRequestId` checks compare message, effective domain, route, and the accepted composer-ref fingerprint. | API-001, DATA-001 | idempotency tests |
| FR-007 | `PromptAssemblyService` runs after ref validation and before `TurnOrchestrator`; it preserves `ConversationTurn.user_message` as the original user text. | AI-001 | orchestration tests |
| FR-008 | Public API, SSE, logs, traces, fixtures, screenshots, and docs expose only safe accepted-ref metadata. Raw resolved content, template body, prompt text, provider payloads, private ids, paths, and raw LightRAG hits stay server-private. | QA-002, EVT-001 | safety scans |
| FR-009 | `/chat` renders left discovery, center conversation/composer, and right inspector on desktop, with center-first collapsed side regions on narrow viewports. | DESIGN.md, F-009 | frontend/visual tests |
| FR-010 | Frontend components use typed Context Engine wrappers only; only shared API/SSE foundations may call `fetch`. | F-009 | frontend tests |

## Data And Contracts

Contracts patched by F-012:

- API-001: composer ref discovery, turn request extension, safe history fields, canonical ref errors, and forbidden fields.
- AI-001: `PromptAssemblyService`, private assembly ordering/caps, template placement, and route-gate interaction.
- DATA-001: prompt template catalog, token hash storage, accepted turn refs, redaction/invalidation, and idempotency fingerprint.
- EVT-001: safe `acceptedRefs` metadata in `done` and idempotent terminal replay only.
- F-009: three-region `/chat` layout and Local Studio slice adaptation.
- F-011: wiki ref eligibility boundary and continued manual Smart Composer separation.

## Acceptance Criteria

- AC-001: F-012 and all affected contracts define the behavior before code depends on it.
- AC-002: Fresh migration creates prompt-template, ref-token, and accepted-turn-ref persistence without forbidden raw-content columns.
- AC-003: Composer ref discovery returns safe metadata and opaque tokens only.
- AC-004: Valid Source/Evidence/Wiki/Template refs validate and persist safe accepted metadata.
- AC-005: Stale, deleted, redacted, unauthorized, out-of-domain, malformed, or excessive refs fail before SSE opens.
- AC-006: `PromptAssemblyService` integrates with direct LLM and domain RAG without changing browser route authority or exposing prompt assembly.
- AC-007: Idempotent replay includes accepted-ref fingerprint behavior and never calls provider/retrieval for persisted terminal turns.
- AC-008: History and terminal/replay `done` events project safe `acceptedRefs`; mid-stream events do not expose raw prompt/context.
- AC-009: `/chat` presents the three-region Local Studio-parity workbench and omits forbidden Local Studio runtime controls.
- AC-010: Safety scan finds no raw prompt, raw source text, template body, private ids, paths, provider payloads, secrets, or raw LightRAG hits in public artifacts.

## Resolved Decisions

| ID | Decision | Applies to |
| --- | --- | --- |
| F012-D1 | Keep the existing P7 `turns:stream` transport; fire-and-forget is frontend state over SSE, not a new queue. | API, frontend |
| F012-D2 | Use stored random ref tokens: browser receives token string, server stores token hash and target metadata. | API, DATA |
| F012-D3 | Default caps are max 10 refs total, max 4 per kind, template body 2000 chars, wiki body 4000 chars, source context 4 blocks or 1000 chars per source, total assembly 8000 chars. | AI |
| F012-D4 | `@` opens composer mention/discovery. `Enter` submits, `Shift+Enter` inserts newline, and `Esc` closes the picker. | UX |
| F012-D5 | Desktop workbench breakpoint is 1180px. Narrow layouts keep conversation/composer primary and expose side regions as drawers/tabs. | UX |
