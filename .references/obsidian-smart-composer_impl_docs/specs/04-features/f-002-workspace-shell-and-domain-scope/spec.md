---
id: F-002
title: Workspace Shell and Domain Scope
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-001]
supersedes: []
---
# Workspace Shell and Domain Scope

## User outcome

A user can select an authorized domain and work inside a stable Local Studio-style chat workspace.

## In scope

- Create authenticated workspace navigation, header, domain picker, and chat-page frame.
- Fetch authorized domain summaries only.
- Keep selected domain in URL or feature state with a single canonical owner.
- Show member/admin navigation visibility without trusting it for security.

## Explicitly out of scope

- No chat request.
- No document upload.
- No domain lifecycle actions.
- No cross-domain retrieval.

## Routes affected

- `/chat`
- `/chat?domain=<id>` or approved route equivalent.

## API contracts consumed

- `GET /api/v1/domains` proposed source/evidence contract.

## Data models

- `DomainSummary { id, name, status, queryEligible }`.

## Authorization behaviour

Backend returns only authorized domains. UI blocks submit when no query-eligible domain is selected, but API must enforce it.

## UI states

- Loading: domain list skeleton.
- Empty: no accessible domains.
- Error: typed domain-list failure.
- Unauthenticated: session redirect.
- Forbidden: no access to direct domain route.
- Success: current domain visible and selectable.

## Original source references

- `src/ChatView.tsx` narrow shell composition.
- `src/components/chat-view/Chat.tsx` toolbar/history/new-chat interaction reference.

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
