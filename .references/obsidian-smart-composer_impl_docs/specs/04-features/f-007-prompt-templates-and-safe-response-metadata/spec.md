---
id: F-007
title: Prompt Templates and Safe Response Metadata
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-004]
supersedes: []
---
# Prompt Templates and Safe Response Metadata

## User outcome

Users can insert approved reusable prompt templates and inspect non-sensitive response metadata.

## In scope

- Template list/select/create/edit/delete according to approved ownership policy.
- Template expansion into composer draft only.
- Render safe model/profile, elapsed time, citation count, and turn outcome metadata.

## Explicitly out of scope

- No raw system prompts, provider keys, provider account settings, token-price calculators in browser, or end-user provider switching.

## Routes affected

- `/chat`; optional `/settings/templates` only if existing app style requires it.

## API contracts consumed

- Template contract to be approved before implementation.
- Chat completion `metadata` payload.

## Data models

- `PromptTemplate`, `TurnMetadata`.

## Authorization behaviour

Server enforces template scope/owner. The API only exposes safe model profile names, not provider credentials/configuration.

## UI states

- Loading: template list.
- Empty: no templates.
- Error: template operation failure.
- Unauthenticated: redirect.
- Forbidden: unavailable management control.
- Success: template inserted and safe metadata displayed.

## Original source references

- `src/components/modals/TemplateSectionModal.tsx`
- `src/components/modals/template-section/`
- `src/components/chat-view/LLMResponseInfoPopover.tsx`
- `src/database/modules/template/`

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
