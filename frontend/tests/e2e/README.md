# Playwright E2E (F-009 pilot happy path)

Live-stack browser proof for login, direct chat, domain RAG + Evidence Panel, logout, and the DESIGN screenshot matrix.

## Prerequisites

1. Start the runnable stack and wait until healthy:

   ```bash
   docker compose --env-file .env.stack.local -f compose.stack.yml up --build -d
   ```

2. Ensure `.env.stack.local` has `CE_ADMIN_USERNAME` / `CE_ADMIN_PASSWORD` (same values the stack seeds).
3. Optional: `PLAYWRIGHT_BASE_URL` (default `http://127.0.0.1:3000`).
4. One-time browser install: `npx playwright install chromium` from `frontend/`.

Global setup fails fast if `/login` is unreachable and seeds one indexed Knowledge Domain via the frontend `/api/v1` proxy.

## Commands

```bash
cd frontend
npm run test:e2e
npm run test:e2e:headed
```

## Artifacts

- Seed metadata: `tests/e2e/artifacts/seed.json` (no secrets)
- Screenshots: `tests/e2e/artifacts/*.png`
- Playwright output: `test-results/`, `playwright-report/`

All of the above are gitignored. Review screenshots locally for AC-008; do not commit filled password fields or secrets.

If host ports `8000`/`3000` are already taken, override when starting compose and point Playwright at the frontend port:

```bash
STACK_API_PORT=8012 STACK_FRONTEND_PORT=3010 docker compose --env-file .env.stack.local -f compose.stack.yml up --build -d
cd frontend && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3010 npm run test:e2e
```
