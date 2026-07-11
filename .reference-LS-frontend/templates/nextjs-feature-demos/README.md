# Next.js Feature Demo Templates

This folder contains modular Local Studio parity demo slices. Each feature can be copied into a Next.js App Router project independently.

## Run locally

A minimal host app lives in `demo-app/` so you can preview any slice without copying files first:

```bash
cd demo-app
npm install
npm run dev
```

Open [http://localhost:3033](http://localhost:3033) and pick a feature, or go directly to e.g. `/features/dashboard`.

See `demo-app/README.md` for details.

## Use Pattern

1. Copy `_shared/` into the target demo app.
2. Copy one feature folder from `features/<feature>/`.
3. Import the demo component from that feature's `index.ts`.
4. Import `_shared/styles/local-studio-tokens.css` from the app root.
5. Replace fixture APIs with real endpoints only when implementing production integration.

## Feature Folders

- `navigation-sidebar`
- `dashboard`
- `settings-panel`
- `environment-controls`
- `logs-observability`
- `usage-cost-reporting`
- `chat-shell`
- `user-preferences`
- `admin-configuration`
- `recipes-models`
- `setup-wizard`
- `agent-workspace`

## Boundaries

- Shared code is limited to UI primitives, a tiny demo shell, token notes, and mock API helpers.
- Feature APIs are fixture-backed by default.
- Do not add app-wide auth, routing, data-fetching, plugin, or runtime systems to this template package.
- If a feature needs production behavior, wire that feature's `api/` folder directly to the documented endpoint contracts — see `docs/feature-parity/backend-wiring.md` for per-slice FastAPI endpoint tables and the chat SSE worked example.
