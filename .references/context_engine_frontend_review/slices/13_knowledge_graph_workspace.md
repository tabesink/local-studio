# Slice 13 — Knowledge Graph Workspace

    ## User outcome
    User opens graph route, sees stable graph loading/empty/error state and safe inspected entity details from backend graph proxy.

    ## In scope
    - Build `/database-visualize` page shell.
- Call only verified graph proxy/list/detail endpoints after OpenAPI capture.
- Render graph canvas/list fallback with selected-node detail pane.
- Use evidence/document link affordances only when IDs/permissions supplied by API.
- Add no graph mutation in first pass.

    ## Explicitly out of scope
    - Graph editing.
- Client-side graph inference.
- Raw LightRAG exposure.
- Domain lifecycle.
- Full graph analytics.
- Custom visualization engine.

    ## Routes affected
    - `/database-visualize`

    ## Frontend modules
    - `features/graph/GraphPage.tsx`
- `GraphCanvas.tsx`
- `GraphDetailsPanel.tsx`
- `api.ts`
- `types.ts`

    ## API contracts consumed
    - Graph proxy endpoints exist in backend architecture; exact endpoint names/models **capture before wiring**.

    ## Data models
    - Graph node/edge/detail DTO unknown.
- Selected node ID local UI state.
- Document/evidence link DTO only if API provides it.

    ## Authorization behavior
    Authenticated read only if backend grants. Admin-only graph controls must not be assumed. Never call LightRAG direct from browser; backend proxy is boundary.

    ## UI states
    - Loading: canvas/list skeleton.
- Empty: no graph/domain data explanation.
- Error: safe retry.
- Unauthenticated: login redirect.
- Forbidden: backend 403 state.
- Success: nodes/edges or accessible list fallback.
- Selection: detail panel; no stale detail after graph refresh.

## UI parity
- Confirmed: v1 client exposes `database-visualize` route/rail entry; backend architecture describes graph proxy routes.
- Unknown: exact graph contract, role rules, renderer library. Capture before build.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Parity: workbench surface, low visual noise, right detail panel optional.', 'Graph cannot be only visual channel: keyboard/list fallback mandatory.', 'Keep node color/status semantics minimal/accessibly labeled.']

    ## Acceptance criteria
    - Graph data hook maps API DTO to renderer-neutral `GraphViewModel`.
- Renderer component has no API calls.
- Use URL search param for selected node only if verified desired; local state first.

    ## Tests
    - Route loads safely with empty graph.
- Selected node details match returned data.
- Keyboard/list fallback exposes same key details.
- No direct browser call to LightRAG/internal service.

    ## Files to create
    - Success: nodes/edges fixture.
- Validation: n/a read-only.
- Unauthenticated: route redirect.
- Unauthorized: 403 state.
- Network/API: retry.
- Edge: selected node removed during refresh clears details.

    ## Files to modify
    - `app/(app)/database-visualize/page.tsx`
- `features/graph/api.ts`
- `types.ts`
- `GraphPage.tsx`
- `GraphCanvas.tsx`
- `GraphDetailsPanel.tsx`
- `tests/graph/page.test.tsx`

    ## Deliberately not added
    - nav route
- app shell placeholder

    ## Dependencies
    - Graph mutation.
- Raw backend client.
- Complex analytics.
- Speculative graph cache.

    ## Evidence / verification
    - 03 App Shell.
- 09 Documents Library.
