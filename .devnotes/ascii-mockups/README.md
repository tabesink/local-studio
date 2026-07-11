# Context Engine ASCII Mockups

Status: implementation handoff draft.

Use these files as terse UI build notes for junior devs and coding agents. They are not product authority. Active specs, contracts, `AGENTS.md`, `CONTEXT.md`, and `DESIGN.md` win on conflict.

## Shared Workstation Frame

```text
48px rail        primary route canvas                         optional right workbench
+--------+--------------------------------------------------+-----------------------+
| CE     | Route header / local controls                    | Context / detail      |
| chat   |--------------------------------------------------|-----------------------|
| lib    | Dense list, table, graph, or conversation thread  | Evidence, preview,    |
| graph  |                                                  | operations, settings  |
| ops    | Anchored footer/composer where route needs it     |                       |
| gear   |                                                  |                       |
+--------+--------------------------------------------------+-----------------------+
```

Local Studio parity means compact dark-first workbench: `zai-dark`, Geist, Geist Mono for IDs/timestamps, 24/28px rows, 28px controls, quiet borders, status dot plus text, no generic white dashboard.

## Main App Navigation

The thin app shell navigation remains global and outside route content:

```text
Chat -> Library/Documents -> Graph -> Settings dialog -> Logout
```

`Library/Documents` maps to the existing `/documents` route unless F-009 is patched to rename the label. The `/chat` left `Chats/Wiki` panel is route-local navigation only; it does not replace the main shell rail.

## Authority Path

```text
PORT structure  -> old CE client shell/routes/layout
RESTYLE skin    -> DESIGN.md + Local Studio tokens/primitives
WIRE data       -> specs/03-contracts P1-P8 only
```

Observed local reference paths:

| Reference use | Local checkout path |
| --- | --- |
| old CE structure port | `.references/ce-local-studio/webui/src/` |
| Local Studio visual codebase | `.references/code/local-studio-codebase/frontend/src/` |
| Smart Composer adaptation docs | `.references/obsidian-smart-composer_impl_docs/` |

Do not edit `.references/`.

## Folded Reference Pack

These mockups also fold in the junior wiring pack at `.references/feature-ce-api-uiux-wirering-brainstorm/`.

| Pack doc | Folded into |
| --- | --- |
| `00-system-wiring-map.md` | `README.md`, `F-000-shared-contract.md`, `shell.md` |
| `01-local-studio-parity-cheatsheet.md` | all UI mockups; local codebase path corrected above |
| `02-ce-client-port-map.md` | `shell.md`, `main-chat.md`, `F-004-source-documents-preparation.md`, `settings.md` |
| `F-000-shared-contract.md` | `F-000-shared-contract.md` |
| `F-001-trusted-application-foundation.md` | `F-001-trusted-application-foundation.md`, `shell.md` |
| `F-002-trusted-runtime-config.md` | `settings.md` |
| `F-003-knowledge-domains-runtime.md` | `settings.md`, `main-chat.md` |
| `F-004-source-documents-preparation.md` | `F-004-source-documents-preparation.md` |
| `F-005-lightrag-indexing-eligibility.md` | `F-004-source-documents-preparation.md`, `evidence.md` |
| `F-006-scoped-evidence-retrieval.md` | `evidence.md`, `main-chat.md` |
| `F-007-grounded-streaming-chat.md` | `main-chat.md`, `chat-sessions.md` |
| `F-007-chat-shell-flow.md` | `main-chat.md`, `evidence.md` |
| `F-007-context-panel-tabs.md` | `evidence.md`, `main-chat.md` |
| `F-008-observability-pilot-gate.md` | `logs.md`, `dashboard.md`, `usage.md` |
| `F-009-frontend-delivery.md` | `README.md`, `shell.md`, route mockups |
| `F-009-frontend-slices.md` | `README.md`, slice notes across route mockups |

## Smart Composer Reference Pack

Use `.references/obsidian-smart-composer_impl_docs/` only for F-011-deferred Composer/Wiki implementation clues.

| Pack doc | Use for |
| --- | --- |
| `README.md` | adaptation boundary and delivery order |
| `SOURCE_PIN.md` | pinned upstream commit and source anchors |
| `PACKAGE_MANIFEST.json` | package contents, proposed contracts, feature map |
| `COPYING_AND_ATTRIBUTION.md` | MIT copy rules and prohibited transfer list |
| `REVIEW_SUMMARY.md` | keep/replace/exclude decisions |
| `FOLDER-STRUCTURE.md` | agent navigation inside the package |

Portable ideas: composer context-token UX, conversation history, cancellation/partial rendering, evidence/citation layout, response metadata, prompt templates, and future diff-review visuals.

Non-portable: Obsidian host APIs, local vault/PGlite/JSON persistence, direct provider calls, browser API keys/OAuth, local RAG ownership, MCP execution, and direct filesystem writes.

## File Map

| File | Surface | Main gate |
| --- | --- | --- |
| `shell.md` | Auth shell, rail, app frame | F-009 slices 02-03 |
| `chat-sessions.md` | Conversation list | F-007, F-009 slice 11 |
| `main-chat.md` | Chat thread, composer, SSE | F-007, EVT-001, AI-001 |
| `evidence.md` | Right workbench Evidence tab / provenance inspector | F-006, F-007, F-009 tabs |
| `settings.md` | Global settings dialog | F-001, F-002, F-003, F-009 |
| `F-004-source-documents-preparation.md` | Documents library, upload, PDF shell | F-004, F-005, F-009 slices 09-10 |
| `dashboard.md` | Future operator overview | F-010 deferred |
| `logs.md` | Audit/diagnostics viewer | F-008 now, F-010 UI deferred |
| `usage.md` | Usage/cost reporting | F-010 deferred |
| `wiki-library.md` | Published wiki browser | F-011 deferred |
| `smart-composer.md` | Wiki contribution workspace | F-011 deferred |
| `F-000-shared-contract.md` | Global guardrails | F-000 |
| `F-001-trusted-application-foundation.md` | Login/session/forbidden states | F-001 |
| `F-010-shared-node-operations.md` | Node operations contract stub | F-010 deferred |

## Wiring Rules

```text
Browser
  -> typed feature API/SSE wrappers
  -> Context Engine API /api/v1
  -> Postgres, worker, controller, provider, LightRAG privately
```

- Browser auth is `ce_session` HttpOnly cookie only. No token storage.
- Shared UI primitives never fetch.
- Feature modules own DTO mapping and endpoint wrappers.
- Unknown field shape means fixture-capture task, not guessed UI.
- Browser never sends route, model, provider, prompt, topK, retrieval mode, runtime URL, source path, Docker target, API key, or raw provider payload.
- Public Evidence uses turn-scoped evidence ref ids only. Never expose Source Document ids, Source Block ids, raw LightRAG hits, paths, scores, or full source text.

## Visual Parity Rules

```text
Use:
  AppPage / RoutePageShell / ListGroup / Table / RightDetailPanel
  Button / Input / Select / Tabs / SegmentedControl
  StatusDot / StatusPill / ProgressBar / ErrorBox

Avoid:
  white SaaS canvas
  card grids for operational lists
  broad blue buttons
  gradients, hero art, full-pill chrome
  nested cards
  client-side lifecycle or eligibility inference
```

## Stop Lines

- Stop if a UI needs a field not in API-001, EVT-001, DATA-001, AI-001, or an approved feature contract.
- Stop if source navigation needs private source/block ids. Wait for opaque source-ref contract.
- Stop if F-010/F-011 screens need dashboard, node, cost, wiki write, review, or publish APIs. Those are deferred until promoted contracts exist.

## QA For This Folder

- No pending-task tokens or empty mockup bodies.
- ASCII diagrams only.
- Every file names specs, route/module, API/SSE/data wiring, parity rule, and forbidden drift.
