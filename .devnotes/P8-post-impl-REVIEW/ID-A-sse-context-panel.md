# ID-A - SSE stream and context panel (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/03-contracts/events/context-engine-sse-v1.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/04-features/F-009-frontend-delivery/context-panel-tabs.md`, `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`, `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-chat-shell-flow.md`.

**Question:** Can P9 build the chat route as a simple message list plus streaming text?

## Decision

No. P9 must port the two-column chat shell and build `ContextPanelShell` with a tab registry from v1. Evidence goes to the `context` tab from P7 SSE `evidence` events before answer tokens.

Direct LLM turns render no Evidence and no citations. Domain RAG turns render Evidence/citations from current-turn events only.

## Why

| Bad path | Good path |
| --- | --- |
| Flatten chat to one column and put citations inline only. | Preserve two-column shell with right context panel. |
| Hard-code old `SidePanel` because only one tab exists. | Use `CONTEXT_PANEL_TAB_IDS` and router from v1. |
| Start answer tokens and then fill Evidence later. | EVT-001 requires Evidence before grounded answer tokens. |
| Let UI choose direct/RAG route or model. | Server classifies and resolves. |
| Reconstruct citations from Markdown. | Use persisted/current-turn Evidence refs. |

## Required Events

```text
stage
evidence
token
done
error
```

Rules P9 must render:

| Route/outcome | UI rule |
| --- | --- |
| `direct_llm` | no evidence rows, no citations, no source claims |
| `domain_rag` grounded | context tab receives evidence before answer tokens |
| `no_grounded_context` | no fabricated answer; show safe terminal state |
| `evidence_only` | show Evidence and terminal fallback; no answer tokens after provider failure |
| failed terminal `error` | show safe message and request id if available |
| replay | render persisted safe events; do not show as a new retrieval/provider run |

## Implementation Sketch

```typescript
export const CONTEXT_PANEL_TAB_IDS = ["context"] as const;
export type ContextPanelTabId = (typeof CONTEXT_PANEL_TAB_IDS)[number];

type ContextPanelState = {
  open: boolean;
  activeTab: ContextPanelTabId;
  width: number;
};
```

```text
SSE evidence event
  -> contextByTurnId[turnId]
  -> ContextTabPanel
  -> row select
  -> SourceInspectorPane safe detail
```

Do not add terminal, side-chat, operations, or tools tabs in v1.

## Implement Order

1. Capture SSE transcript fixtures named by EVT-001 before UI assertions.
2. Implement SSE parser over Context Engine event names, not provider chunks.
3. Implement `ContextPanelShell`, `ContextPanelRouter`, `ContextTabPanel`.
4. Port old CE `SessionContextNavigation` and `SourceInspectorPane` content into the context tab.
5. Wire direct turn render path: no context rows/citations.
6. Wire domain turn render path: evidence event first, then answer tokens.
7. Add cancel/retry/error UX without exposing provider/model/retrieval controls.
8. Add redacted turn behavior: clear derived answer/evidence display from server state.

## Red Flags In PR

- `CONTEXT_PANEL_TAB_IDS` is absent.
- Context tab fetches Evidence through a second endpoint during a chat turn.
- Direct LLM turn shows Evidence rows, source inspector data, or citations.
- Browser sends route/model/provider/prompt/retrieval/tool fields.
- Stage UI displays planning text or reasoning.
- Provider-native stream payloads are forwarded to components.
- `done.citations` are matched by labels only, not current-turn evidence ref ids.
- Cancel only hides the spinner and does not abort the fetch.

## Tests

- SSE parser fixture: domain RAG evidence before token.
- SSE parser fixture: direct LLM has no evidence event and empty citations.
- UI test: context tab populates from `evidence` event before answer tokens render.
- UI test: `no_grounded_context` shows no answer bubble with invented content.
- UI test: `evidence_only` shows Evidence and safe terminal state.
- UI test: replay does not duplicate local messages.
- Import/snapshot test: chat UI has no model/provider/tool/retrieval controls.

## One-line summary

Build the right panel and stream parser around EVT-001 first; the chat UI is not just text deltas.
