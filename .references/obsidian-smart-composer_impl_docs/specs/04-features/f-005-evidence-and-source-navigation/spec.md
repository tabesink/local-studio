---
id: F-005
title: Evidence and Source Navigation
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-004]
supersedes: []
---
# Evidence and Source Navigation

## User outcome

A user can inspect the server-returned evidence behind an answer and navigate to an authorized source locator.

## In scope

- Render citation markers tied to `referenceId`.
- Add evidence panel/drawer with source title, bounded excerpt, locator, and safe open action.
- Render empty/no-evidence state explicitly.
- Keep evidence associated with its turn.

## Explicitly out of scope

- No local similarity search.
- No raw retriever scores unless backend intentionally exposes a safe interpretation.
- No direct private source-storage URL.

## Routes affected

- `/chat`; optional source-detail route approved by API contract.

## API contracts consumed

- `API-EVD-001` and `API-CHAT-001`.

## Data models

- `EvidenceItem`, `Citation`, `EvidencePanelState`.

## Authorization behaviour

FastAPI authorizes every evidence/source read. A reference that is no longer readable must render a redacted/unavailable state.

## UI states

- Loading: evidence fetch/open.
- Empty: answer has no evidence.
- Error: failed or redacted evidence.
- Unauthenticated: redirect.
- Forbidden: safe unavailable state.
- Success: evidence/citation navigation.

## Original source references

- `src/components/chat-view/SimilaritySearchResults.tsx`
- `src/components/chat-view/MarkdownReferenceBlock.tsx`
- `src/components/chat-view/AssistantMessageAnnotations.tsx`

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
