---
id: F-003
title: Context Composer and Safe Mentions
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-002]
supersedes: []
---
# Context Composer and Safe Mentions

## User outcome

A user composes a question and adds allowed source/evidence tokens without exposing raw vault or document data.

## In scope

- Build rich text or simple controlled composer based on existing Next.js design system.
- Add source/evidence search and token chips.
- Allow remove/reorder context tokens.
- Send token references—not browser-built prompt text.

## Explicitly out of scope

- No external URL extraction, images, YouTube transcripts, clipboard file ingestion, or arbitrary attachment support.
- No local vault/current-file token.
- No direct prompt compiler.

## Routes affected

- `/chat` only.

## API contracts consumed

- Sources/evidence search and DTO contract.
- Chat-turn request `contextReferences`.

## Data models

- `ComposerDraft`, `ContextReference`, `SourceSummary`, `EvidenceItem`.

## Authorization behaviour

Backend validates every reference belongs to selected domain and caller is allowed to read it.

## UI states

- Loading: mention search.
- Empty: no source matches.
- Error: safe search failure.
- Unauthenticated: session redirect.
- Forbidden: reference omitted/rejected.
- Success: selected chips and validated submit state.

## Original source references

- `src/components/chat-view/chat-input/`
- `src/types/mentionable.ts`
- `src/utils/chat/mentionable.ts`
- `src/components/chat-view/Chat.tsx`

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
