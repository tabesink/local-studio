---
id: F-000
title: Source Baseline and Decision Gates
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Source Baseline and Decision Gates

## User outcome

The team can reproduce the reviewed reference and knows which source capabilities may or may not be transferred.

## In scope

- Pin the source repository and MIT licence.
- Record verified source paths and classification labels.
- Create hard no-port rules and open decisions.

## Explicitly out of scope

- No Context Engine runtime code.
- No source-code copying.
- No behavioural changes.

## Routes affected

- None.

## API contracts consumed

- None; creates review authority only.

## Data models

- SourcePinRecord (documentation only).

## Authorization behaviour

Not applicable.

## UI states

- Loading: not applicable.
- Empty: not applicable.
- Error: pinned revision missing or differs from review.
- Success: exact ref and licence verified.

## Original source references

- `src/main.ts`
- `src/ChatView.tsx`
- `src/components/chat-view/Chat.tsx`
- `src/constants.ts`

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
