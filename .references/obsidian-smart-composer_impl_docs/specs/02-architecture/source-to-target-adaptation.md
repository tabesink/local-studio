---
id: ARCH-002
title: Source-to-target adaptation map
status: approved
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Source-to-target adaptation map

## Transfer rule

```text
Smart Composer code
  → classify capability
  → preserve UX intent only where it fits
  → replace host-bound behaviour with Context Engine contract
  → remove the source runtime dependency
```

| Capability | Source implementation | Target implementation | Disposition |
|---|---|---|---|
| Chat shell | Obsidian `ChatView` + React | Next.js route/layout + feature module | rebuild |
| Input and mention UX | Rich local composer + Obsidian files/blocks | source/evidence tokens from API | adapt |
| Chat stream | `ResponseGenerator` direct provider calls | FastAPI SSE | replace |
| Vault search | local `RAGEngine` / vector manager | Context Engine retrieval | replace |
| Local chat history | JSON/PGlite | PostgreSQL/API | replace |
| Prompt templates | local DB/modal | FastAPI template resource + Next dialog | adapt |
| Source citations | markdown reference/evidence components | Context Engine Evidence DTO | adapt |
| Model metadata | direct provider/client state | safe server response metadata | adapt |
| Document edit | direct `TFile` mutation | gated change-proposal contract | defer |
| MCP tools | local MCP manager | no target feature | exclude |
| OAuth/model keys | plugin settings/constants | admin-only server provider config | exclude |
| URL/image/YouTube extraction | client/plugin utilities | separate approved ingest policy only | defer |

## Non-negotiable boundary

```text
Next.js Browser
  → same-origin /api/v1
  → FastAPI
     → PostgreSQL / retrieval / provider runtime / worker

No Browser → provider, Browser → LightRAG, Browser → database,
or Browser → filesystem path is permitted.
```
