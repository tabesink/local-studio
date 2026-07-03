# Chat Shell Wiring — Modular Frontend Boundaries

How F-009 chat UI connects to the orchestrator without coupling to RAG internals.

---

## Layer Split

```text
┌────────────────────────────────────────────────────────────┐
│  PRESENTATION (components)                                  │
│  MessageBubble, ChatComposer, SessionContextNavigation    │
│  — render DTOs, emit user intents                           │
└────────────────────────────┬───────────────────────────────┘
                             │ callbacks
┌────────────────────────────▼───────────────────────────────┐
│  SHELL CONTROLLER (LightRagChatShell)                       │
│  — turn lifecycle, optimistic UI, AbortController           │
│  — maps SSE → store updates                                 │
└────────────────────────────┬───────────────────────────────┘
                             │ calls
┌────────────────────────────▼───────────────────────────────┐
│  TRANSPORT (lib/api/chat-turn.ts)                           │
│  — POST SSE, parse events, no business rules                │
└────────────────────────────┬───────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼───────────────────────────────┐
│  BACKEND ChatTurnService + TurnOrchestrator                 │
└────────────────────────────────────────────────────────────┘
```

Shell owns UX state. Transport owns protocol. Backend owns RAG control flow.

---

## Store Boundaries

```text
chat-session-store
  messages[]                      thread rendering
  contextByAssistantId{}          evidence per turn
  sessionContextLedger            side panel list
  requestLifecycle                abort + stale guard

lightrag-domain-store
  selectedDomainId                required per turn (F-007)

LightRagChatShell (local)
  sidePanelOpen
  synthesisAvailable              from capability endpoint
```

Orchestrator mode (`direct|advanced`) is **not** in browser stores — server policy only.

---

## One Turn — UI State Machine

```text
idle
  │ user send (domain set)
  ▼
connecting ── append user msg + empty assistant ("Thinking...")
  │ SSE open
  ▼
streaming ── evidence event → fill context panel FIRST
  │         token events → append assistant markdown
  ▼
idle ───── done | error | evidence_only terminal
```

```text
     ┌─────────┐  send   ┌────────────┐  evidence  ┌───────────┐
     │  idle   │───────►│ connecting │───────────►│ streaming │
     └────▲────┘        └────────────┘            └─────┬─────┘
          │                                             │
          └──────────────── done/error ─────────────────┘
```

---

## SSE Handler Map (F-007 / EVT-001)

| SSE event | Store mutation | Panel behavior |
| --- | --- | --- |
| `evidence` | `contextByAssistantId[id] = items` | ledger append, select turn |
| `token` | append assistant `content` | — |
| `done` | finalize message, citations metadata | keep panel |
| `error` | `lastError`, mark bubble failed | keep partial evidence if any |

Optional future `stage` → activity line or subtle status chip ("Retrieving…"). Not required for pilot.

---

## Modular Panel Tabs (future-safe)

```text
ContextPanelShell
├── tabs[0] Context    ← P9 v1 (evidence + source inspector)
├── tabs[1] Terminal   ← future, empty stub OK
└── tabs[2] SideChat   ← future, empty stub OK
```

Tab shell mounts now; only Context tab wires to evidence SSE. Orchestrator changes do not require new tabs.

---

## Do-Not-Couple List

```text
✗ MessageBubble importing retrieval types
✗ SessionContextNavigation calling /evidence directly during turn
  (evidence comes from turn SSE only during chat)
✗ Composer exposing top-k / retrieval mode
✗ Store persisting provider or prompt fields
```

Standalone evidence probe (`POST /domains/{id}/evidence`) remains a separate admin/debug surface — not the chat turn path.

---

## Build Order (frontend)

```text
1. Port shell layout (mock data)
2. Wire domain store + composer validation
3. Wire SSE transport + stale-request guard
4. Bind evidence panel to SSE evidence event
5. Token stream + done terminal
6. Cancel + domain-switch abort
7. Stage indicator (optional, after EVT-001 patch)
```

Slices 11–12 in F-009 frontend plan align with steps 1–6.
