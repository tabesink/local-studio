# Main Chat

Status: implementation handoff draft.

## Purpose

Conversation transcript, compact composer, Context Engine SSE stream, safe citations. No wiki mutation.

## Contract Note

This mockup intentionally changes `/chat` from the current F-009 two-column shell into a three-panel route shell:

```text
left library panel | main chat transcript | right workbench tabs
```

This is route-internal only. The main app shell still owns global navigation:

```text
Chat -> Library/Documents -> Graph -> Settings dialog
```

Patch F-009 `spec.md`, `ux.md`, `ce-client-port-and-parity.md`, `context-panel-tabs.md`, and `frontend-slice-map.md` before implementation.

## Specs

- `specs/04-features/F-007-grounded-streaming-chat/spec.md`
- `specs/04-features/F-007-grounded-streaming-chat/ux.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`
- `specs/03-contracts/events/context-engine-sse-v1.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/04-features/F-009-frontend-delivery/context-panel-tabs.md`

## Reference Targets

- `.references/ce-local-studio/webui/src/features/chat/ChatRoute.tsx`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-chat-shell-flow.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-context-panel-tabs.md`
- `.references/obsidian-smart-composer_impl_docs/README.md`
- `.references/obsidian-smart-composer_impl_docs/SOURCE_PIN.md` for chat/composer interaction anchors only
- `.references/code/local-studio-codebase/frontend/src/ui/markdown-content.tsx`
- `.references/code/local-studio-codebase/frontend/src/ui/status.tsx`

## Wiring Pack Notes

Folded from the chat shell flow:

```text
slice 11 -> three-panel shell, chat sessions/wiki library, right workbench registry
slice 12 -> SSE parser, evidence before tokens, cancel/retry
```

Port old CE chat behavior, but adapt route geometry:

```text
LightRagChatShell
  left: ChatLibraryPanel
    tabs: Chats | Wiki
  center: ConversationView + inline follow-up composer
  right: RightWorkbenchShell
    tabs: Evidence | Composer
```

Smart Composer docs inform the future right `Composer` handoff and chat interaction comparison only. F-007 SSE, conversation persistence, domain rules, and evidence safety remain the active authority.

## ASCII Mockup

```text
/chat
+--------------------------+---------------------------------------+------------------------------+
| Context Engine           | Main Chat                             | Right Workbench              |
| [ Chats ] [ Wiki ]       | Domain: Damper Faults                 | [ Evidence ] [ Composer ]    |
|--------------------------+---------------------------------------+------------------------------|
| + New chat               | User                                  | Evidence for selected turn   |
| Search chats             | Why is this damper failing?           |                              |
|                          |                                       | [D1] Test report p.8         |
| Today                    | Assistant                             | [W1] Wiki v4 claim           |
| - Damper failure triage  | The likely issue is...                | [F1] Field note              |
| - Supplier comparison    |                                       | [T1] Team decision           |
|                          | [Use in Smart Composer]               |                              |
|                          |                                       |                              |
|                          | Ask follow-up...                [^]   |                              |
+--------------------------+---------------------------------------+------------------------------+
```

## SSE Wiring

```text
POST /api/v1/conversations/{conversation_id}/turns:stream
body:
  clientRequestId
  message
  domainId?       // optional; browser never sends route/model/provider/prompt

events:
  stage    -> compact activity label
  evidence -> contextByAssistantId + EvidenceTabPanel before answer tokens
  token    -> append answer text
  done     -> terminal status, citations, budget, replay flag
  error    -> terminal safe ErrorBox row
```

Ordering requirement: for `domain_rag`, all non-empty Evidence appears before grounded answer tokens. For `direct_llm`, Evidence and citations are empty.

## Local State From Port

```text
messages[]
libraryPanel: { activeTab: "chats" | "wiki", selectedConversationId, selectedWikiPageId? }
contextByAssistantId
sessionContextLedger
selectedAssistantMessageId
sourceNavigator
requestLifecycle: abortController + clientRequestId + stale guard
streamStatus: idle | connecting | streaming | error
lastError
rightWorkbench: { activeTab: "evidence" | "composer", width }
```

Domain behavior reconciliation:

```text
active contract: domainId is optional in API, but required by server for domain-like questions.
UI: keep selected domain as a compact composer chip/control; no browser route picker.
```

## Turn State

```text
running:
  disable send, show stop
completed/grounded:
  assistantAnswer + citations
completed/no_grounded_context:
  no assistantAnswer, compact empty-evidence terminal row
completed/evidence_only:
  evidence shown, no answer tokens
failed:
  safeError only
redacted:
  keep userMessage, clear answer/evidence/citations
```

## Parity Rules

- Use three stable panels inside `/chat`; do not turn chats/wiki/evidence/composer into floating cards.
- Keep global Chat, Library/Documents, Graph, and Settings access in the main app shell rail.
- Center composer is an inline follow-up composer for the selected Conversation Turn.
- Right Composer tab is Smart Composer handoff/workspace, not the main chat input.
- Left `Wiki` tab is read-only/deferred until F-011 contracts exist.
- Markdown body uses readable Sans; ids, timestamps, model/profile labels use Mono.
- Stage labels are safe values only: `classifying`, `planning`, `retrieving`, `verifying`, `answering`, `direct_answering`.
- Stop/retry/error states must be visible and keyboard reachable.

## Do Not Wire

- No browser route picker, retrieval mode, topK, model, provider, prompt, tool, source path, or API key.
- No Local Studio terminal, files, Git, browser agent, Pi runtime, host skills, split-pane workspace, or local JSONL session authority.
- No source navigation until opaque source-ref contract exists.
- No durable wiki write/review/publish from the Composer tab until F-011 contracts exist.
