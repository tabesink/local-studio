# Implementation Map

## Composition

Target folder:

```text
webui/
  src/
    app/
      layout.tsx
      providers.tsx
      (public)/login/page.tsx
      (app)/layout.tsx
      (app)/chat/page.tsx
      (app)/documents/page.tsx
      (app)/graph/page.tsx
      forbidden/page.tsx
    features/
      auth/
      navigation/
      settings/
      documents/
      chat/
      graph/
      operations/
    lib/
      api/
        client.ts
        contracts.ts
        errors.ts
        stream.ts
      config/
        env.ts
      theme/
        themes.ts
    components/
      ui/
      shared/
    styles/
      tokens.css
      globals.css
```

Dependency direction:

```text
route/layout -> feature UI -> feature hook/controller -> typed API/SSE client -> FastAPI
```

Forbidden dependency direction:

```text
shared primitive -> raw fetch
shared primitive -> role decision
feature component -> backend URL string
```

## Package Versions

Verified from npm `latest` tags on 2026-06-29:

| Package | Version |
| --- | ---: |
| `next` | `16.2.9` |
| `react` | `19.2.7` |
| `react-dom` | `19.2.7` |
| `typescript` | `6.0.3` |
| `tailwindcss` | `4.3.1` |
| `@tailwindcss/postcss` | `4.3.1` |
| `eslint` | `10.6.0` |
| `@playwright/test` | `1.61.1` |
| `vitest` | `4.1.9` |
| `lucide-react` | `1.22.0` |
| `sonner` | `2.0.7` |
| `zod` | `4.4.3` |
| `clsx` | `2.1.1` |
| `tailwind-merge` | `3.6.0` |
| `class-variance-authority` | `0.7.1` |
| `@radix-ui/react-dialog` | `1.1.17` |
| `@radix-ui/react-tooltip` | `1.2.10` |
| `next-themes` | `0.4.6` |

Before implementation, rerun `npm view <package> version` for these packages if the date is no longer 2026-06-29.

## Theme Contract

Dark theme is default:

```text
html[data-theme="zai-dark"]
```

Light theme is equivalent:

```text
html[data-theme="zai-light"]
```

Implementation rules:

- Copy/adapt Local Studio token names and alias structure from `.references/code/local-studio/frontend/src/app/styles/globals/tokens.css`.
- Provide both `zai-dark` and `zai-light` before building feature screens.
- Use `--ui-*` implementation tokens and compatibility aliases such as `--bg`, `--fg`, `--surface`, `--rail`, `--border`, `--accent`, `--dim`, `--ok`, `--warn`, and `--err`.
- Persist only non-secret theme preference.
- All shell screenshots and Playwright visual checks must run in both dark and light themes.
- Do not make light theme pure white/blue SaaS. It must be the Local Studio warm neutral system.

## Shell Contract

The first visible shell has:

- original Context Engine page-frame topology from `.references/code/client/src/components/layout/AppPageFrame.tsx`;
- compact fixed icon rail inside the framed work surface, based on `.references/code/client/src/components/layout/AppSideRail.tsx`;
- primary work canvas;
- optional right detail panel reserved for future evidence, document, operation, graph-node, and log detail;
- dense rows at `24px` or `28px`;
- compact icon buttons from `lucide-react`;
- route-aware active state;
- role-aware navigation visibility;
- loading, empty, error, forbidden, and unauthenticated states that preserve shell structure.

Layout rule:

- Preserve original Context Engine webui route/frame topology.
- Apply Local Studio tokens, themes, density, surfaces, focus states, and dialogs to that topology.
- Do not replace the original framed workspace with a full-bleed generic dashboard shell.
- Do not replace route-owned chat/documents/graph surfaces with a generic centered placeholder card.

Initial navigation:

| Item | Route | Role |
| --- | --- | --- |
| Chat | `/chat` | member/admin |
| Documents | `/documents` | member/admin |
| Knowledge Graph | `/graph` or compatibility route `/database-visualize` | member/admin, verify backend role behavior |
| Operations | `/operations` | admin |
| Settings | dialog trigger | member/admin, admin sections hidden for member |

Backend remains authorization authority even when UI hides admin controls.

## State Ownership

| State | Owner | Frontend rule |
| --- | --- | --- |
| Current user and role | FastAPI | read from `/auth/me` or future `/api/v1/session/me` |
| Domain access | FastAPI | read accessible domains only; do not fetch all and hide client-side |
| Provider secrets | FastAPI | never expose secret value; show configured/missing/test status only |
| Document status | FastAPI/worker | render server status; no guessed lifecycle |
| Operation status | FastAPI/worker/poller | poll or consume supported event source; no client-invented status |
| Retrieval evidence | backend retrieval/synthesis services | render IDs/data received; do not copy full document content unless contract allows |
| Theme and rail preference | browser UI preference | non-secret only |
| Settings dialog open/section | frontend | local UI state |

## Test Expectations

- Unit tests for API error normalization, config validation, role filtering, nav state, and theme token presence.
- Component tests for shell, side rail, settings dialog accessibility, and forbidden state.
- Playwright smoke tests for `/chat`, `/documents`, `/graph`, `/forbidden` in dark and light themes.
- No test may require real credentials unless it is explicitly marked integration and documented.

