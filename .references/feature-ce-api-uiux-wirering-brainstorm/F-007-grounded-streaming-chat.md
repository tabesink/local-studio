# F-007 — Grounded Streaming Chat

**Phase P7 · Member SSE · UI slices 11–12**

## Outcome

User-owned conversations. Each turn = one domain + grounded answer or safe fallback.

## API Surface (capture before impl)

| Method | Route | Notes |
| --- | --- | --- |
| CRUD | `/conversations/*` | owner-scoped |
| POST SSE | `/conversations/{id}/turns/stream` | requires `domainId`, `clientRequestId`, `question` |

Contract: `specs/03-contracts/sse/` + API-001 P7 section.

## Turn Flow

```text
Client                          Server
  │ POST SSE { domainId, clientRequestId, question }
  │──────────────────────────────►│
  │◄── event: evidence ───────────│  (P6 callable)
  │◄── event: token ──────────────│  synthesis stream
  │◄── event: terminal ───────────│  complete | no_grounded_context | evidence_only
  │                               │
  │ disconnect ──────────────────►│ abort + clear running
```

## Terminal Outcomes

| Result | UI |
| --- | --- |
| complete | full answer + citations |
| no_grounded_context | no tokens; explain no evidence |
| evidence_only | show evidence; synthesis failed safely |
| 409 running | disable composer until turn ends |

## Idempotency

Same `clientRequestId` in conversation → return existing result, no second provider call.

## UI Wiring

Port old CE chat shell entirely. **Deep dive:** `F-007-chat-shell-flow.md` · **Tabs:** `F-007-context-panel-tabs.md`

| Slice | Responsibility |
| --- | --- |
| 11 | `LightRagChatShell`, `ContextPanelShell`, `ContextTabPanel` shell |
| 12 | SSE parser, evidence → Context tab, token stream, cancel |

```text
/chat  (LightRagChatShell — NOT RoutePageShell)
├── LEFT: ConversationView + ChatComposer
└── RIGHT: ContextPanelShell (v1 tab: context)
      ContextTabPanel → SessionContextNavigation + SourceInspectorPane
```

## Chat Composer Rules

- domain required every turn
- no model picker, no prompt editor (pilot)
- submit disabled if capability not ready
- cancel aborts SSE

## Redaction (server)

Source/domain hard delete → answer + citations removed; user question kept. UI refreshes on next load.

## LS refs

- composer: `features/agent/` workspace + composer context
- messages: agent message list density
- streaming text: `ui/markdown-content.tsx`
- raised composer shadow: DESIGN.md §6.2

## Never

- send provider/model/prompt fields from browser (422)
- general-knowledge fallback UI
- RAG bypass toggle

## Spec

`specs/04-features/F-007-grounded-streaming-chat/spec.md`
