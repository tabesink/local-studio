# F-007 — Chat Shell End-to-End Flow (Junior Dev)

Port **old CE chat UI/UX entirely** for `/chat`. Restyle with `DESIGN.md`. Rewire API to P7 contracts.

**Port from:** `.references/code/context-engine/client/src/`

---

## 1. What You Copy

Chat is a **2-column RAG workbench**, not a generic chat page.

```text
/chat
└── AppPageFrame (shared icon rail)
    └── LightRagChatShell              ← all chat UX lives here
        ├── LEFT: conversation column
        │     ├── RoutePageHeaderSection ("Chat")
        │     ├── ConversationView
        │     └── ChatComposer
        └── RIGHT: ContextPanelShell          ← tabbed; v1 tab = context
              └── ContextTabPanel
                    ├── SessionContextNavigation   (evidence list)
                    └── SourceInspectorPane        (selected source detail)
```

**Tab architecture:** `F-007-context-panel-tabs.md` — build shell for future tabs (terminal, side-chat).

**Do not** wrap chat in `RoutePageShell` (Documents/Graph use that). Chat owns its layout in `LightRagChatShell.tsx`.

---

## 2. Visual Anatomy

```text
┌──┬────────────────────────────────────────────┬──────────────────────────────┐
│▣ │ Chat                                       │ SidePanel (context)          │
│💬│ ┌────────────────────────────────────────┐ │ ┌──────────┬─────────────────┐ │
│  │ │ User bubble (right, muted box)         │ │ │ Context  │ Source inspector│ │
│  │ │ Assistant bubble (center, markdown)    │ │ │ nav      │ text, figures,  │ │
│  │ │   "Thinking..." while streaming        │ │ │ filters  │ tables          │ │
│  │ └────────────────────────────────────────┘ │ │ All/This │                 │ │
│  │ Synthesis: Ready ●                         │ │ Pinned   │                 │ │
│  │ [error strip]                              │ │ rows     │                 │ │
│  │ ┌────────────────────────────────────────┐ │ └──────────┴─────────────────┘ │
│  │ │ [+] │ Ask LightRAG Domain...      [↑] │ │   resizable 33% / 67% split    │
│  │ └────────────────────────────────────────┘ │                                │
└──┴────────────────────────────────────────────┴──────────────────────────────┘
     max-w-4xl thread                         lg: ~58vw, collapsible
```

Mobile: SidePanel = slide-over drawer. Collapsed → expand button in header.

---

## 3. File Map

| Layer | CE client path | Job |
| --- | --- | --- |
| Route | `app/chat/page.tsx` | `AppPageFrame` → `ChatRoute` |
| Entry | `features/chat/ChatRoute.tsx` | → `LightRagChatShell` |
| **Orchestrator** | `components/chat/LightRagChatShell.tsx` | turn logic, SSE, state |
| Messages | `components/chat/ConversationView.tsx` | scroll, auto-scroll |
| Bubble | `components/chat/MessageBubble.tsx` | user vs assistant markdown |
| Input | `components/chat/ChatComposer.tsx` | textarea + send + `[+]` popover |
| Domain | `components/chat/RetrievalSettingsPopover.tsx` | domain select in popover |
| Panel | `components/chat/SidePanel.tsx` | collapsible + resizable split |
| Evidence | `components/chat/SessionContextNavigation.tsx` | filters, pins, groups |
| Detail | `components/chat/SourceInspectorPane.tsx` | source text/assets |
| Assets | `components/chat/AssetCards.tsx` | figures/tables |
| State | `stores/chat-session-store.ts` | messages, ledger, navigator |
| Domains | `stores/lightrag-domain-store.ts` | selected domain |
| SSE | `lib/api/chat-query.ts` | `streamChatTurn`, parser |
| Ledger | `lib/session-context-ledger.ts` | evidence entries, filters |
| Types | `types/chat.ts` | DTOs |

---

## 4. State Model

### `chat-session-store`

```text
messages[]                   thread bubbles
contextByAssistantId{}       evidence per assistant turn
sessionContextLedger         side panel list
selectedAssistantMessageId   active turn for panel binding
sourceNavigator              SourceInspectorPane content
requestLifecycle             abortController + requestId (stale guard)
status                       idle | connecting | streaming | error
lastError                    composer error strip
```

### `lightrag-domain-store`

```text
domains[]          GET /domains (available only)
selectedDomainId   required every turn (F-007)
```

### Local (LightRagChatShell)

```text
sidePanelOpen         collapsed/expanded
synthesisAvailable    from capability endpoint
```

---

## 5. Lifecycle

### A. Page load

```text
1. AppPageFrame + LightRagChatShell mount
2. loadDomains()
3. refreshCapability()  → synthesis badge
4. Empty state: logo + starter prompt button (if no messages)
5. SidePanel open on desktop
```

### B. Compose

```text
ChatComposer
  [+] popover → Upload (admin → /documents) + Domain select
  Textarea    → Enter send, Shift+Enter newline, max-height 220px
  [↑] Send    → disabled when busy/empty/no domain

Block if synthesisAvailable === false (toast)
```

### C. Submit → optimistic UI

```text
1. Build history from existing messages
2. Append userMessage + empty assistantMessage ("Thinking...")
3. Append activity "Query started"
4. status = connecting; select assistant message
5. beginRequestLifecycle(abortController, requestId)
6. POST SSE stream
```

### D. SSE events

| Event | UI |
| --- | --- |
| `sources` | Evidence first → `contextByAssistantId` + `sessionContextLedger`. Side panel fills. `status = streaming`. |
| `answer_complete` | Full markdown in assistant bubble. Activity complete. `idle`. |
| `evidence_only` | Fallback message; evidence stays in panel. `idle`. |
| `error` | `lastError`, bubble error, activity failed. |
| no terminal | "Chat stream ended before completion." |
| abort | "Query canceled" |

**Rule:** evidence in right panel **before** answer text finishes.

Rebuild maps old `sources` → F-007 `evidence` event; confirm names in EVT-001 fixture.

### E. Side panel interaction

```text
Click assistant bubble → selectedAssistantMessageId → "This answer" filter

Click evidence row → loadSourceNavigator(domainId, nodeId)
                   → fetchWorkspaceSourceContext (stub until slice 16 contract)
                   → SourceInspectorPane
```

```text
SidePanel
├── ContextStatusStrip
└── ResizablePanelGroup
      ├── 33% SessionContextNavigation  (All | This answer | Pinned)
      └── 67% SourceInspectorPane
```

### F. Domain change

```text
selectedDomainId changes → abort stream → clearSessionContextForDomain()
```

### G. Errors

| Case | Behavior |
| --- | --- |
| 409 synthesis unavailable | Roll back optimistic turn, toast |
| AbortError | Canceled state |
| Source fetch fail | Error in SourceInspectorPane |

---

## 6. Message Rendering

| Role | Treatment |
| --- | --- |
| User | Right-aligned, muted bordered box, plain text |
| Assistant | Center, max-w-3xl, ReactMarkdown/GFM |
| Streaming | Empty content → "Thinking..." dot |
| Selected | Muted border highlight; clickable |
| Error | Red text under bubble |

Response action icons (thumbs up, jump-to-context) — port UI; wire later.

---

## 7. Restyle (Local Studio)

Keep geometry; swap tokens:

| Old CE | LS / DESIGN.md |
| --- | --- |
| `bg-white` main | `--color-background` |
| `bg-muted/70` composer | LS composer surface + §6.2 shadow |
| emerald/amber synthesis badge | `StatusPill` good/warning |
| `border-neutral-*` | `--color-border` |
| prose-neutral | `MarkdownContent` |

---

## 8. API Rewire (greenfield)

Port UI first; adapt `chat-query.ts`:

| Old CE | Rebuild F-007 |
| --- | --- |
| `POST /chat/turn/stream` | conversation SSE route (API-001/EVT-001) |
| Bearer token | `ce_session` cookie only |
| Optional `domain_id` | **Required** `domainId` |
| Client `conversationId` in store | Server `conversations` + `clientRequestId` |
| `GET /chat/capability` | confirm DTO via fixture |
| `fetchWorkspaceSourceContext` | blocked until slice 16 opaque source-ref |

Port SSE parser (`readSseStream`, `parseSseEvent`) verbatim; adjust event names/payloads per fixture.

---

## 9. Build Order

```text
1. Port shell components (static/mock, no API)
2. Wire GET /domains → domain select in composer popover
3. Wire capability badge
4. Port chat-session-store + session-context-ledger
5. Wire SSE turn → existing onEvent handlers
6. Source navigator (contract) OR empty states
7. Restyle DESIGN.md tokens
8. Playwright: submit, evidence-before-answer, cancel, domain-required, mobile drawer
```

P9 slices: **11** = shell + composer; **12** = SSE + evidence panel.

---

## 10. Do-Not-Break

```text
✓ 2-column layout + tabbed ContextPanelShell (v1: context tab)
✓ Evidence in right panel (not thread-only)
✓ Assistant click binds active turn
✓ Domain in composer [+] popover (not header dropdown)
✓ Optimistic user + empty assistant pair
✓ AbortController on cancel/domain change
✓ isStaleRequestResult — ignore late SSE
```

---

## One Turn in 10 Lines

```text
User sends → append user + empty assistant
  → POST SSE(domainId, clientRequestId, question)
  → sources/evidence event → fill SessionContextNavigation
  → tokens/answer_complete → markdown in assistant bubble
  → terminal → idle, clear lifecycle
  → click evidence row → SourceInspectorPane detail
```

## See Also

- `F-007-context-panel-tabs.md` — modular tab shell (v1: Context/evidence)
- `F-007-grounded-streaming-chat.md` — backend contract summary
- `02-ce-client-port-map.md` — chat section in port map
- `F-009-frontend-slices.md` — slices 11–12
- `specs/04-features/F-007-grounded-streaming-chat/spec.md`
