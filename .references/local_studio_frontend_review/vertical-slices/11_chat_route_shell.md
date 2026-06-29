# 11 — Chat Route Shell

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Give RAG query page Local Studio agent-workspace feel. Keep one grounded question -> one answer. No agent session feature.

## Entry points

Domain -> Query/Chat. Composer. Retrieval mode choice. Start new question.

## Evidence and target

**OBSERVED:** Context Engine has chat app/components/store and a current JSON retrieval client. Local Studio has agent workspace/chat-pane composition.

**TARGET:** Reuse shell/composer/thread/inspector grammar. Replace agent-specific action areas with domain, model-profile status, retrieval mode, evidence.

## User flow

1. User enters domain chat route.
2. Route checks selected domain + active synthesis profile.
3. Existing ephemeral turns render.
4. User types question.
5. Submit starts one turn.
6. Composer disables duplicate submit; Stop appears while stream active.
7. Evidence inspector opens on citation.
8. New question starts new turn. No saved conversation assumption.


## Local Studio visual transfer

| Element | Use |
|---|---|
| Shell | Left rail. Center canvas. Optional right detail panel. |
| Density | `24px` small rows. `28px` controls/standard rows where primitive supports it. |
| Type | Geist for UI/body. Geist Mono for IDs, paths, model names, durations, payloads. |
| Surfaces | Dark-first close charcoal layers. 1px quiet borders. No card grid. |
| Actions | White/black high-contrast primary. Quiet danger. Compact icon/ghost secondary. |
| State | `StatusDot`/`StatusPill`; thin progress; compact error box. |
| Detail | Inspector stays in context. Do not route away for a small inspection. |


## Ownership

| State | Owner | Rule |
|---|---|---|
| Domain access/ready state | FastAPI | Query endpoint checks again. |
| Active model profile | FastAPI | Client may display summary. |
| Composer text | Chat feature | Keep typed text on validation/config error. |
| Turn list | Chat feature | Current browser session only. |
| Evidence selection | Chat feature | Opens shared inspector. |

## Target API boundary

```http
GET  /api/v1/domains/{domain_id}
GET  /api/v1/chat/configuration
POST /api/v1/domains/{domain_id}/chat/turns
```

`GET /chat/configuration` may be avoided when domain response already has safe `synthesis_available`. Do not add redundant config endpoint.

## State model

```text
no domain -> choose domain
domain stopped -> blocked + state message
no active profile -> composer remains editable; submit shows toast
ready -> composing -> streaming -> completed
streaming -> aborting -> stopped/failed
```


## Required UI states

| State | Required UI |
|---|---|
| Loading | Preserve layout. Local skeleton/quiet progress. No page flash. |
| Empty | Short sentence + one next action. No illustration by default. |
| Error | Compact `ErrorBox`. Clear recovery action. |
| Forbidden | Explain role boundary. Do not fake disabled success. |
| Pending mutation | Disable duplicate action. Keep server truth visible. |
| Background refresh | Small status. Do not block current read-only work. |


## Do not build

No Local Studio Pi runtime.
No tool list.
No agent sessions.
No terminal/browser pane.
No durable chat table.
No hidden model switch per turn unless product requirement changes.
No white marketing chat surface.

## Acceptance criteria

- Composer keeps text if profile unavailable.
- Member queries allowed domain.
- Blocked domain shows state.
- New question starts independent turn.
- Right panel opens citations.
- Shell visual parity at target viewports.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`client/src/app/chat/`; `client/src/components/chat/`; `client/src/stores/chat-session-store.ts`; `client/src/lib/lightrag-client.ts`; `app/api/routes/retrieve.py`; Local Studio `frontend/src/features/agent/ui/chat-pane.tsx`, `agent-workspace-shell.tsx`, `frontend/src/ui/right-detail-panel.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
