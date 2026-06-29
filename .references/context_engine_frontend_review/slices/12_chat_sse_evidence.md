# Slice 12 — Chat SSE + Evidence

    ## User outcome
    User submits question, sees source/evidence event then streamed completion/evidence-only/error outcome; can cancel safely; no unverified token-delta protocol invented.

    ## In scope
    - Invoke `POST /chat/turn/stream` with `Accept: text/event-stream`, cookie credentials, AbortController.
- Parse SSE incrementally through one bounded parser.
- Handle observed event categories: `sources`, `answer_complete`, `evidence_only`, `error`.
- Render source/evidence from sources event before/with terminal content.
- Handle duplicate client turn (`409 CHAT_TURN_DUPLICATE`) with clear retry/new-turn rule.
- Cancel active request locally via AbortController; add server cancel only if contract exists.

    ## Explicitly out of scope
    - WebSocket.
- Invented token/chunk delta events.
- Reconnect/resume protocol.
- Persisted conversation history.
- Provider raw output inspection.
- Automatic retry.

    ## Routes affected
    - `/chat`

    ## Frontend modules
    - `features/chat/stream/sse.ts`
- `stream-controller.ts`
- `useChatTurn.ts`
- `ChatMessage.tsx`
- `EvidenceList.tsx`
- `ChatTurnError.tsx`

    ## API contracts consumed
    - `POST /chat/turn/stream` SSE
- `GET /chat/capability`

    ## Data models
    - Sources event: domain/evidence/assets/citations/context budget fields exact map verify.
- Terminal: answer_complete OR evidence_only. Error event.
- Chat request has `client_turn_id`; duplicate error code confirmed.

    ## Authorization behavior
    Authenticated. Backend validates domain, retrieval/synthesis, permissions, evidence. Browser sends question/history only; never provider secret/role/tenant claims. Preserve backend 401/403 behavior.

    ## UI states
    - Idle: no active turn.
- Submitting: user message locked/pending.
- Sources received: evidence panel populated.
- Streaming/awaiting terminal: stable assistant frame + cancel.
- Answer complete: final assistant answer.
- Evidence only: no synthesized answer; render evidence explanation.
- Error: safe retry/new question action.
- Canceled: explicit local canceled state.
- Duplicate: create new turn ID or show existing-turn guidance based on verified server semantics.

## UI parity
- Confirmed: backend returns SSE media type; client reads incrementally with bounded buffer.
- Confirmed: observed event types sources/answer_complete/evidence_only/error; 409 CHAT_TURN_DUPLICATE exists.
- Runtime capture required: exact JSON payloads, ordering guarantees, heartbeat/cancellation semantics.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Sources appear as compact structured blocks, not giant cards.', 'Assistant message frame must not jump when terminal event lands.', 'Use readable markdown only after safe renderer/sanitizer choice; no raw HTML.']

    ## Acceptance criteria
    - Parser module returns typed events; it does not mutate React state.
- Controller owns AbortController, phase, event ordering, turn identity.
- Reducer/state machine rejects impossible late events after terminal state.
- Bound buffered line/event size; error on malformed oversized stream.

    ## Tests
    - Known terminal paths render correctly: answer_complete, evidence_only, error.
- Sources event maps evidence without raw internal payload leakage.
- Abort stops reader and prevents later state updates.
- 409 duplicate does not duplicate user/assistant UI.
- No assumed token events/progress percent/reconnect.

    ## Files to create
    - Success: fixture SSE sources→answer_complete.
- Validation: empty prompt blocked before stream.
- Unauthenticated: stream 401 login behavior.
- Unauthorized: stream 403 safe error.
- Network/API: broken connection/malformed SSE/5xx.
- Edge: sources→evidence_only; duplicate 409; abort after sources; terminal event split across chunks.

    ## Files to modify
    - `features/chat/stream/sse.ts`
- `stream-controller.ts`
- `useChatTurn.ts`
- `ChatMessage.tsx`
- `EvidenceList.tsx`
- `ChatTurnError.tsx`
- `tests/chat/sse-parser.test.ts`
- `tests/chat/stream-controller.test.tsx`

    ## Deliberately not added
    - Chat shell imports controller
- API client stream helper

    ## Dependencies
    - Token-delta renderer.
- WebSocket/reconnect.
- Automatic resend.
- Raw chain-of-thought/provider logs.

    ## Evidence / verification
    - 11 Chat Route Shell.
