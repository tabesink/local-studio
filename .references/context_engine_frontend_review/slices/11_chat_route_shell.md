# Slice 11 — Chat Route Shell

    ## User outcome
    Authenticated user opens `/chat`, sees capability state, composer, local conversation frame, domain requirement guidance; no stream parsing yet.

    ## In scope
    - Build `/chat` route shell.
- Fetch `GET /chat/capability`.
- Render ready/setup-required/config-invalid states.
- Build composer: question text, optional domain selector only when backend capability/flow requires it, submit disabled by prerequisites.
- Create local turn draft model and initial message placeholders.
- Generate per-submit client turn ID.

    ## Explicitly out of scope
    - SSE parsing.
- Partial answer rendering.
- Conversation persistence across reload.
- Model selector UI.
- Prompt templates.
- Client-side retrieval.

    ## Routes affected
    - `/chat`

    ## Frontend modules
    - `features/chat/ChatPage.tsx`
- `ChatCapabilityGate.tsx`
- `ChatComposer.tsx`
- `ConversationFrame.tsx`
- `chat-api.ts`
- `types.ts`

    ## API contracts consumed
    - `GET /chat/capability`
- `POST /chat/turn/stream` request shape defined but invoked in Slice 12.

    ## Data models
    - Chat capability: ready/setup_required/configuration_invalid.
- Chat request: domain_id optional, client_turn_id, question, conversation history.
- Local draft/turn state.

    ## Authorization behavior
    Authenticated. Server decides domain requirements and synthesis availability. UI cannot claim chat ready solely from selected local values. Member/admin same chat behavior unless backend says otherwise.

    ## UI states
    - Loading: capability skeleton.
- Setup required: explanatory empty state; admin gets Settings route affordance, member gets contact/admin message.
- Configuration invalid: safe configuration error state.
- Empty: first-question prompt.
- Ready: composer enabled.
- Validation: empty/too-long question local + server.
- Unauthenticated: login redirect.

## UI parity
- Confirmed: v1 `/chat` route delegates to LightRagChatShell.
- Confirmed: `/chat/capability` uses ready/setup-required/config-invalid concepts; stream request supports domain/client turn id/question/history.
- Verify domain selector source and exact capability response fields.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Parity: central conversation workbench; readable width; composer anchored visually low.', 'Sources/evidence reserved region but no fake cards until stream events arrive.', 'Use compact send/cancel control geometry.']

    ## Acceptance criteria
    - Capability gate owns readiness. Composer owns text/draft validation.
- Create `ChatTurnDraft` before request. Stream feature will attach event state.
- Use client-generated UUID once per submit; preserve on manual retry only if backend idempotency semantics prove it.

    ## Tests
    - `/chat` renders capability-aware shell.
- Ready state allows non-empty question submit path to stream controller seam.
- Missing required domain produces guidance before/after server validation.
- No answer fabricated before SSE terminal event.

    ## Files to create
    - Success: ready capability + composer.
- Validation: blank/whitespace question.
- Unauthenticated: route guard.
- Unauthorized: server 403 safe state.
- Network/API: capability error/retry.
- Edge: `setup_required` vs `configuration_invalid` maps distinct visible state.

    ## Files to modify
    - `app/(app)/chat/page.tsx`
- `features/chat/types.ts`
- `chat-api.ts`
- `ChatPage.tsx`
- `ChatCapabilityGate.tsx`
- `ChatComposer.tsx`
- `ConversationFrame.tsx`
- `tests/chat/shell.test.tsx`

    ## Deliberately not added
    - navigation config
- App Shell route placeholder

    ## Dependencies
    - SSE parser.
- Persistent chat history.
- Local RAG fallback.
- Model switcher.

    ## Evidence / verification
    - 03 App Shell.
- 01 API/Error Foundation.
