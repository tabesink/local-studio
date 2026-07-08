# Local Studio Modular Feature Parity Package

This package reverse-engineers selected Local Studio frontend features into lean, independent Next.js vertical slices. It is designed for junior developers and coding agents that need to rebuild one feature at a time with UI/UX parity while keeping surrounding app concerns minimal.

## Source Baseline

Use `.references/local-studio/frontend/src` as read-only evidence.

Primary evidence paths:

- `app/layout.tsx` and `app/providers.tsx` for root shell and global providers.
- `features/shell/left-sidebar.tsx` and `store.ts` for navigation/sidebar persistence.
- `lib/api/*` and `app/api/*` for API client and route contracts.
- `ui/*` for the compact Local Studio visual grammar.
- Selected feature folders under `features/*`.

## Feature Docs

- [Navigation Sidebar](features/navigation-sidebar.md)
- [Dashboard](features/dashboard.md)
- [Settings Panel](features/settings-panel.md)
- [Environment Controls](features/environment-controls.md)
- [Logs / Observability](features/logs-observability.md)
- [Usage / Cost Reporting](features/usage-cost-reporting.md)
- [Chat Shell](features/chat-shell.md)
- [User Preferences](features/user-preferences.md)
- [Admin Configuration](features/admin-configuration.md)
- [Recipes / Models](features/recipes-models.md)
- [Setup Wizard](features/setup-wizard.md)
- [Agent Workspace](features/agent-workspace.md)

## Backend Wiring

[backend-wiring.md](backend-wiring.md) documents how each slice's `api/` module is
the swap point for a real FastAPI/Python backend: per-slice endpoint tables,
polling cadences, and a worked end-to-end example wiring the chat interaction
pipeline to a FastAPI SSE endpoint using the `status`/`pi` frame envelope.

## Template Package

Starter scaffolds live under `templates/nextjs-feature-demos`.

Each feature folder is intentionally small:

```txt
features/<feature>/
  README.md
  components/
  hooks/
  api/
  types/
  fixtures/
  constants/
  index.ts
```

Shared demo support is limited to `_shared/ui`, `_shared/shell`, `_shared/api`, `_shared/fixtures`, and `_shared/styles`.

## Implementation Rules

- Match Local Studio's compact dark-first workbench UI.
- Keep every demo fixture-backed by default.
- Use one tiny API adapter per feature.
- Use React local state for feature demos unless the reference explicitly uses persisted global UI state.
- Do not add auth, databases, broad providers, plugin runtimes, workflow engines, or generic state machines.
- Do not invent account/user models. The reference stores UI preferences locally.

## Acceptance Checklist

- Every feature doc uses the required headings.
- Every meaningful endpoint is traced to a source path.
- Loading, empty, error, polling/SSE, and success states are documented.
- Templates can be copied independently without dragging unrelated features.
- Copy/modify maps point to reference code, but scaffolds remain clean reimplementations.
