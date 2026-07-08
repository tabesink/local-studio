# Feature Demo Playground

Minimal Next.js host app for previewing the template slices in this package without copying them into a separate project.

## Quick start

```bash
cd demo-app
npm install
npm run dev
```

Open [http://localhost:3033](http://localhost:3033) and pick a feature, or go directly to a route:

- [http://localhost:3033/features/dashboard](http://localhost:3033/features/dashboard)
- [http://localhost:3033/features/chat-shell](http://localhost:3033/features/chat-shell)

## How it works

- `demo-app/` is the only runnable Next.js project here.
- Feature source stays in `../features/` and shared code in `../_shared/`.
- `next.config.ts` enables `experimental.externalDir` so the app can import those sibling folders.
- Each route under `/features/[slug]` renders the exported `*Demo` component from that feature's `index.ts`.

## Copy into your own app

When you are ready to integrate a slice into a real project, follow the package README one level up: copy `_shared/` and the feature folder into your app, then wire the demo component yourself.
