---
id: F-001
title: Next.js Composition Root and Safe Session Bridge
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-000]
supersedes: []
---
# Next.js Composition Root and Safe Session Bridge

## User outcome

A signed-in user reaches a protected Next.js workspace shell through the existing Context Engine session boundary.

## In scope

- Create App Router public/authenticated route groups.
- Add one typed HTTP client, error normalization, and session resolver.
- Create minimal shared providers for theme, toast, and session display only.
- Render loading, unauthenticated, forbidden, and general error states.

## Explicitly out of scope

- No chat, domain, source, provider, or document workflow.
- No browser token storage.
- No client-side role trust.

## Routes affected

- `/` redirect or landing decision.
- `/chat` protected placeholder.
- `/forbidden` safe state.
- `/login` only if Context Engine owns a web login flow.

## API contracts consumed

- Canonical Context Engine session/current-user contract — confirm actual route before code.
- Common `ApiError` contract.

## Data models

- `CurrentUser { id, displayName, role }` — no secret fields.

## Authorization behaviour

FastAPI proves session and role. Next.js hides unavailable controls only after receiving server-safe user data.

## UI states

- Loading: resolving session.
- Empty: authenticated shell placeholder.
- Error: safe transport error with request ID.
- Unauthenticated: redirect/login path.
- Forbidden: 403 screen.
- Success: protected shell renders current user.

## Original source references

- `src/ChatView.tsx` provider composition is a reference for keeping the root narrow.
- `src/main.ts` is reference only; do not port plugin lifecycle.

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
