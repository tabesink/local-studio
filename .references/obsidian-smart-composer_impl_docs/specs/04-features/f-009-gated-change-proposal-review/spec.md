---
id: F-009
title: Gated Change-Proposal Review
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-005, F-006]
supersedes: []
---
# Gated Change-Proposal Review

## User outcome

None until ADR-005 and `DATA-CHG-001` are approved. This folder exists to prevent accidental porting of Smart Composer direct-file apply.

## In scope

- Decision discovery only.
- Optional static disabled UI explaining that source editing is not available.

## Explicitly out of scope

- No generated diff endpoint.
- No write endpoint.
- No editor, file body, file path, or filesystem access.
- No auto-apply.

## Routes affected

- No functional route.

## API contracts consumed

- `DATA-CHG-001` remains draft.

## Data models

- None until approval.

## Authorization behaviour

Not applicable until an editable-source authorization policy exists.

## UI states

- Empty: feature unavailable.
- Success: explicit product decision recorded.

## Original source references

- `src/ApplyView.tsx`
- `src/components/apply-view/ApplyViewRoot.tsx`
- `src/utils/chat/apply.ts`
- `src/utils/chat/diff.ts`
- `src/components/chat-view/Chat.tsx` apply flow.

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
