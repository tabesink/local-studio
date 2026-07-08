# Evidence Panel — Complete Wiring Map (Junior Dev / Agent Guide)

Companion to `.devnotes/01-agent-workspace-LS-wiring-map.md` (LS agent workspace shell).
This map covers the **RAG evidence path**: old Context Engine → current rebuild gap → locked v1 target.

**Evidence sources (read-only, never edit):**

- Old CE client: `.references/code/context-engine/client/src/`
- Old CE server: `.references/code/context-engine/server/`
- LS panel pattern: `.reference-LS-frontend/templates/nextjs-feature-demos/features/agent-workspace/components/computer-panel.tsx`

**Authority for rebuild:** `specs/03-contracts/events/context-engine-sse-v1.md` (EVT-001),
`specs/03-contracts/api/context-engine-v1.md` (API-001),
`specs/04-features/F-009-frontend-delivery/context-panel-tabs.md`.

---

## 1. Vocabulary (CONTEXT.md — use these words)

| Term | Meaning | Not |
|---|---|---|
| **Evidence** | Mapped, authorized retrieval result safe to show a user | raw LightRAG hit, chunk |
| **Citation** | User-visible reference from an answer back to Evidence | plain link |
| **Source Block** | Stable citable unit inside a Canonical Source (kind: text/figure/table) | Evidence itself |
| **Evidence Panel** | Right-hand aside showing turn-scoped Evidence (this doc) | **Smart Composer** (wiki right panel) |

Public Evidence DTO (all a browser ever sees):

```ts
{ id, citationLabel, sourceLabel, excerpt }   // excerpt bounded, no private ids
```

---

## 2. OLD Context Engine — full RAG + evidence wiring

### 2.1 Turn pipeline

```txt
BROWSER                                   OLD FASTAPI SERVER                PRIVATE
───────                                   ──────────────────                ───────
LightRagChatShell.tsx
  submit()
   ├─ optimistic user+assistant bubbles
   └─ streamChatTurn()  ──────────────►   POST /chat/turn/stream
      (lib/api/chat-query.ts,               api/routes/chat_query.py
       fetch + manual SSE parse,            │ auth + domain eligibility
       AbortController)                     ├─ LightRAG retrieve ─────────► per-domain LightRAG runtime
                                            │    raw hits w/ [CE_BLOCK …] markers
                                            ├─ map hits → Source Blocks (Postgres)
                                            ├─ yield _sse_event("sources", …)   ◄ EVIDENCE FIRST
                                            ├─ synthesis (provider stream)
                                            └─ yield answer_complete | evidence_only | error
```

Old SSE events (client handler at `LightRagChatShell.tsx:311`):

| event | client effect |
|---|---|
| `sources` | fill right panel + `contextByAssistantId[assistantId]` |
| `answer_complete` | final markdown in bubble |
| `evidence_only` | "Answer stream failed after sources were retrieved." — evidence stays |
| `error` | error bubble + `lastError` |

### 2.2 Right panel component tree (old CE)

```txt
LightRagChatShell                          client/src/components/chat/
 ├─ LEFT column
 │   ├─ ConversationView → MessageBubble
 │   └─ ChatComposer (+ RetrievalSettingsPopover)
 └─ SidePanel.tsx                          open by default (desktop), sidePanelOpen useState(true)
     │  desktop: w-[clamp(760px,58vw,1280px)] aside · mobile: slide-over drawer
     └─ PanelContent
         └─ ResizablePanelGroup (~33/67)
             ├─ SessionContextNavigation.tsx    ledger list
             │    filters: All | This answer | Pinned
             │    rows: kind icon (text/figure/table) + title + snippet + pin
             └─ SourceInspectorPane.tsx         selected row detail
                  ├─ badges (kind, page, chunk id, asset id)
                  ├─ excerpt text card
                  └─ AssetCards.tsx
                       ├─ FigureCard  ← authenticated image blob (lib/api/assets.ts)
                       └─ TableCard  ← markdown table parse
```

### 2.3 State + selection (old CE)

```txt
stores/chat-session-store.ts
  contextByAssistantId{}          evidence keyed by assistant message id
  sessionContextLedger            cumulative ledger (lib/session-context-ledger.ts)
                                  caps: maxFrames 50, maxEntries 250, evict unpinned
  selectedAssistantMessageId      click bubble → "This answer" binding
  sourceNavigator                 SourceInspectorPane payload

click evidence row → loadSourceNavigator(domainId, nodeId)
                   → GET workspace context (server schemas/workspace_context.py)
                   → WorkspaceSourceContext { text, assets[], document, page, chunk_id … }
```

**Why the rebuild rejects 2.3's fetch:** `WorkspaceSourceContext` exposes `document_id`,
`asset_id`, `chunk_id`, `source_path`, raw URLs — forbidden by rebuild rule 7
(no private ids/paths in browser contracts). Figure/table inspection returns only
after an **opaque source-ref contract** exists (F-009 slice 16 — open decision).

---

## 3. CURRENT rebuild — what exists today

```txt
frontend/src/features/chat-shell/
 ├─ api.ts             CE adapter: EVT-001 events stage|token|evidence|done|error
 ├─ use-chat-shell.ts  SSE → state: streamEvidence, streamText, turns[]
 ├─ types.ts           EvidenceRow = ChatTurn["evidence"][number]
 └─ ChatShell.tsx      SINGLE column; evidence = inline <details> block in timeline

Backend (DONE, F-006/F-007):
 context_engine/services/chat_turns.py   TurnOrchestrator: evidence SSE BEFORE token
 context_engine/services/evidence.py     CE_BLOCK mapping → safe DTO
 GET /conversations/{id}                 turns[].evidence[] + citations[]
```

Gap vs old CE:

| Old CE | Rebuild today |
|---|---|
| Right SidePanel (ledger + inspector) | none — inline `<details>` per turn |
| Session ledger + filters + pins | none |
| Figure/Table AssetCards | none (blocked on source-ref contract) |
| Click bubble → panel binding | none |
| Markdown answer + citations | plain text; `citations` typed, unrendered |

---

## 4. TARGET v1 — locked decisions

Grill outcomes (2026-07-08):

1. **Data**: SSE Evidence only. No AssetCards, no workspace source fetch.
2. **Layout**: single-column LS `ComputerPanel`-style aside. No 33/67 nested split.
3. **Timeline**: inline "Evidence (N)" blocks removed; panel owns Evidence display.
4. **Scope**: current/selected turn only. No session ledger / All / Pinned.
5. **Open**: closed by default; auto-open when active turn has Evidence; collapsible.
6. **Selection**: click assistant message → that turn's Evidence; streaming follows in-flight turn.
7. **Citations**: `[n]` → panel selection deferred.
8. **Shell**: evidence-only aside, no tab strip (registry types kept for future tabs).
9. **Package**: this map + implementation under F-009 (T-060 slice).

### 4.1 Target wiring

```txt
┌─ AppShell ────────────────────────────────────────────────────┐
│ rail │  ChatShell (answer text only)   │ EvidencePanel        │
│      │   click assistant ─────────────► selectTurn(turnId)    │
│      │   SSE evidence ────────────────► rows + auto-open      │
└──────┴─────────────────────────────────┴──────────────────────┘

EvidencePanel (LS ComputerPanel geometry)
  aside: border-l, bg-(--color-panel), default 440px
         left-edge pointer resize, min max(280px, 25vw), max 65vw
  header (h-10, --color-header): "Evidence" + count + collapse button
  body:
    list rows      [citationLabel] sourceLabel  (quiet surface rows)
    selected row → excerpt detail block (mono-adjacent, bounded text)
```

### 4.2 Data flow (no new fetches, no contract change)

```txt
POST /conversations/{id}/turns:stream          EVT-001
  stage → evidence → token* → done             (domain_rag; evidence BEFORE token)
  stage → token* → done                        (direct_llm; NO evidence event)

use-chat-shell.ts
  event "evidence" → streamEvidence            (already wired)
  NEW: selectedTurnId                          click assistant / follows stream
  NEW: panel rows = streaming ? streamEvidence
                              : turns.find(t => t.id === selectedTurnId)?.evidence
  NEW: panelOpen — auto true on first non-empty rows; user toggle wins after
  reset on conversation switch / new turn submit
```

### 4.3 File map (implementation)

```txt
CREATE  frontend/src/features/chat-shell/EvidencePanel.tsx
MODIFY  frontend/src/features/chat-shell/use-chat-shell.ts   selection + panel state
MODIFY  frontend/src/features/chat-shell/ChatShell.tsx       2-col flex; drop inline evidence render
KEEP    frontend/src/features/chat-shell/api.ts              untouched (contract adapter)
KEEP    frontend/src/features/chat-shell/types.ts            EvidenceRow reused
TESTS   frontend/tests/chat.test.mjs                         panel wiring assertions
```

### 4.4 Do NOT port (v1)

- `AssetCards.tsx` FigureCard/TableCard — needs opaque source-ref contract first
- `session-context-ledger.ts` merge/caps/pins — turn-scoped only
- `loadSourceNavigator` / workspace context fetch — leaks private ids
- Old CE 33/67 `ResizablePanelGroup` split
- LS computer tabs (terminal/files/diff/browser/…) — no CE contract
- Any second evidence fetch path — SSE + conversation history only

---

## 5. Old ↔ new event map (for agents reading old code)

```txt
OLD CE                    REBUILD (EVT-001)
sources            →      evidence
answer_complete    →      token* + done (stopReason=grounded)
evidence_only      →      evidence + done (stopReason=evidence_only)
error              →      error
(none)             →      stage
```

Terminal `stopReason` → panel behavior:

| stopReason | panel | answer tokens |
|---|---|---|
| `grounded` | rows stay | yes |
| `evidence_only` | rows stay | no |
| `no_grounded_context` | empty | no |
| `direct_llm` | no evidence event; panel stays closed for this turn | yes |
