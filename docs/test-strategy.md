# Test Strategy

## Frontend

Run commands from `webui/`:

```bash
npm run lint
npm run test
npm run test:e2e
```

- `npm run lint` runs `tsc --noEmit` for strict type coverage.
- `npm run test` runs Vitest unit tests for boundary logic such as public env parsing, API error normalization, token smoke checks, session user normalization, and navigation role filtering.
- `npm run test:e2e` runs Playwright smoke tests against the Next.js dev server. FE-002 browser tests mock `GET /auth/me` with the same `CurrentUser` contract and cover member/admin navigation, forbidden rendering, settings keyboard close/focus restore, and dark/light shell smoke.

No frontend test should require real credentials. Backend URLs used in tests must be public, fake, and secret-free.

## Setup Notes

From `webui/`:

```bash
npm install
npx playwright install chromium
```

Create `webui/.env.local` with a public backend origin:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Playwright starts its own dev server on port `3456` by default (`PLAYWRIGHT_PORT` overrides). If port `3000` is already in use locally, run manual dev on another port:

```bash
npm run dev -- -p 3460
```

`next.config.ts` lists `allowedDevOrigins` for `127.0.0.1` and `localhost` so client hydration and Playwright smoke tests work when the app is opened by IP rather than hostname.

## Validation Status

Verified on 2026-06-29 after restoring `webui/node_modules`:

```bash
cd webui
npm run lint      # tsc --noEmit
npm run test      # vitest run, 18 tests
npm run test:e2e  # playwright test, 7 tests
npm run build
```

All commands pass when dependencies are installed and Playwright Chromium is available.
