# PRD: Frontend Vertical Slice Rebuild

## Problem

Context Engine needs a Next.js frontend in `webui/` that downstream developers can build slice-by-slice without losing visual parity, API ownership, or backend contract clarity.

The first visible slice is the main authenticated app layout and navigation side panel. It must preserve Context Engine's route/product structure while adopting Local Studio's compact workstation UI language.

## Goals

- Build a Next.js app under `webui/` using current stable package versions verified on 2026-06-29.
- Use vertical slices with one clear baton per issue.
- Make dark theme the default and provide the matching Local Studio light theme from the start.
- Rebuild the Context Engine shell structurally: left navigation rail, primary work canvas, optional future right inspector.
- Use Context Engine product vocabulary and backend-owned data concepts: domains, documents, operations, retrieval evidence, providers, users, and settings.
- Document how each frontend surface connects to API routes, backend services, and data models before backend integration work begins.

## Non-Goals

- Do not copy Local Studio agent runtime, terminal, computer/browser panes, plugins, sessions, model controller, or filesystem behavior.
- Do not implement backend routes in this package.
- Do not implement real settings panels, document upload, chat streaming, graph, or operations in the first shell issue.
- Do not store credentials in `localStorage`, `sessionStorage`, URLs, analytics, logs, or global client stores.
- Do not introduce a generic workflow engine, broad global store, WebSocket chat transport, or dashboard card-grid home.

## Users

- Member: can access read/query surfaces such as Chat, Documents, Graph, and evidence views.
- Admin: can access member surfaces plus users, providers, parser settings, domains, operations, lifecycle, and diagnostics.
- Backend: final authority for auth, role, domain access, lifecycle, persistence, and secrets.

## Experience Requirements

- The app feels like Local Studio: compact, dark-first, dense, quiet, and operational.
- Light theme exists and is visually equivalent, not a separate white SaaS design.
- Navigation is icon-forward, compact, keyboard reachable, and accessible.
- Empty/loading/error/forbidden states preserve shell geometry.
- User-facing copy is concise and does not explain implementation details.

## Success Criteria

- `webui/` can be created and run with documented commands.
- Theme tokens support `zai-dark` and `zai-light`; dark is default.
- The first shell slice renders without real backend feature data by using typed placeholders/fixtures behind the same contract shapes expected from the backend.
- Every frontend feature doc names its API contract, backend owner, data model, role rule, UI states, and tests.

