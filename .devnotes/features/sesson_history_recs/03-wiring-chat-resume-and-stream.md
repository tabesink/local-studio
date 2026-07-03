# 03 — Wiring: Chat Resume, Stream, Route Integration

Connects session history UI (doc 02) to F-007 turn stream + F-009 chat shell.

**References:** `.devnotes/controllable-rag-intergration-plan-v1/02-chat-shell-wiring.md`, `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`

---

## Route Model

| Route | Behavior |
| --- | --- |
| `/chat` | Empty composer or redirect to last conversation (optional pref); `POST` new conversation on first send |
| `/chat/[conversationId]` | Load detail; render thread; composer attaches to this id |
| `/chat/history` | Optional full list dashboard |

**Not** LS `?project=&session=` query params. **Not** `/workspace/` unless spec route map changes — CE port uses `/chat` per F-009.

---

## Load Sequence (open existing conversation)

```text
/chat/[conversationId]/page.tsx
  │
  ├─ useQuery(conversationKeys.detail(id))
  │     GET /api/v1/conversations/{id}
  │
  ├─ map turns[] → chat-session-store messages[]
  │     user bubble ← turn.userMessage
  │     assistant bubble ← turn.assistantAnswer (null → failed/redacted UI)
  │     context ledger ← turn.evidence (domain RAG only)
  │
  ├─ set selectedDomainId from LAST turn with domainId (composer default only)
  │     does NOT mutate prior turns
  │
  └─ if activeTurnStatus === 'running'
        show in-progress indicator; block second send (expect 409)
```

---

## Send Sequence (new turn in existing conversation)

```text
composer submit
  │
  ├─ optimistic: append user msg + empty assistant ("Thinking...")
  ├─ clientRequestId = crypto.randomUUID()
  ├─ POST /conversations/{id}/turns:stream  { clientRequestId, message, domainId? }
  │
  ├─ SSE handler (existing LightRagChatShell)
  │     evidence → context panel
  │     token → append assistant
  │     done | error → finalize
  │
  └─ on terminal:
        invalidate conversation list + detail
        if first turn && title null → list shows message fallback
```

Stale guard: ignore SSE events where `conversationId` or `clientRequestId` ≠ active request.

---

## Store Boundaries (from chat-shell-wiring)

```text
chat-session-store
  conversationId          ← from route param
  messages[]              ← hydrated from GET detail + SSE updates
  contextByAssistantId{}  ← evidence per turn
  requestLifecycle        ← abort + stale guard

conversations feature
  list/detail queries     ← TanStack Query only

DO NOT merge LS active-sessions localStorage into store authority
```

For "running elsewhere" badge: use `activeTurnStatus` from **server list**, not browser cross-tab merge.

---

## New Conversation Flow

**Option A (recommended):** explicit New button

```text
POST /conversations → push /chat/{newId} → empty thread
```

**Option B:** first message creates id

```text
/chat → first send → POST conversation → replace URL without losing optimistic msg
```

Pick one; document in F-009 ux.md. localGPT uses sidebar explicit create.

---

## Turn → Message Mapping

```ts
function turnsToMessages(turns: TurnSummary[]): ChatMessage[] {
  const out: ChatMessage[] = [];
  for (const t of turns) {
    out.push({ id: `${t.id}-user`, role: "user", content: t.userMessage, ... });
    if (t.status === "redacted") {
      out.push({ id: `${t.id}-asst`, role: "assistant", content: "", redacted: true });
    } else if (t.assistantAnswer != null) {
      out.push({ id: t.id, role: "assistant", content: t.assistantAnswer, ... });
    } else if (t.status === "failed") {
      out.push({ id: t.id, role: "assistant", content: "", error: t.safeErrorMessage });
    }
  }
  return out;
}
```

Direct LLM turns: empty evidence. Domain RAG: map `turn.evidence` to context panel entries keyed by turn id.

---

## Quota UX

On `413 conversation_storage_limit_reached` during stream POST:

```text
- Stop optimistic assistant bubble
- Show safe toast
- Keep thread readable
- CTA: delete old conversations (/chat/history)
```

Do not expose byte counts or internal limits in UI copy unless product approves.

---

## Redacted Turns

Render user question; assistant slot shows neutral redacted label per F-007 contract — no citation links, no cached evidence.

---

## Cache Invalidation Matrix

| Event | Invalidate |
| --- | --- |
| Turn `done` / `error` | list + current detail |
| PATCH title | list + detail |
| DELETE conversation | list; redirect if current |
| Logout | all conversation queries |

---

## Build Order (this doc)

```text
W1  Route /chat/[conversationId] + detail fetch hook
W2  turnsToMessages hydrator + redacted/failed states
W3  Wire conversationId into existing SSE transport
W4  Sidebar selection ↔ route sync (use-conversation-route.ts)
W5  Invalidate queries on terminal SSE
W6  Quota error handling
W7  Playwright: reload page restores thread; send appends turn
```

---

## Tests

```text
Integration (mock SSE):
  - open /chat/{id} renders N turns from fixture
  - send invalidates list updatedAt ordering

E2E:
  - create → send → reload → message persists
  - two tabs same conversation: second send gets 409 while streaming
  - 413 shows toast, thread intact
```

---

## Out of Scope

- Pagination within thread (v1 load full detail; add `?before=` cursor if turn count explodes)
- Archive/restore
- Semantic search across history
- Export markdown (LS export is future)
