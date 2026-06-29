# Slice 06 — Settings Dialog — Domains / Knowledge Graph

    ## User outcome
    Admin sees domain registry and safe domain configuration/lifecycle entry points without mixing graph visualization or document workflow.

    ## In scope
    - Admin-only Domains panel.
- Render domain list/status/config summary only from verified domain API.
- Link/launch domain lifecycle actions into dedicated lifecycle slice.
- Explain embedding/model lock or running-domain config implications where API returns them.

    ## Explicitly out of scope
    - Graph visualization.
- Document upload.
- Provider secret edit.
- Automatic migration/recreate logic.
- Generic multi-tenant admin.

    ## Routes affected
    - global Settings dialog section `domains` / current `knowledge-graph` key

    ## Frontend modules
    - `features/settings/domains/DomainsPanel.tsx`
- `features/settings/domains/api.ts`
- `features/settings/domains/types.ts`

    ## API contracts consumed
    - LightRAG/domain API endpoints — exact route names/DTOs require runtime/OpenAPI capture before implementation.

    ## Data models
    - Domain summary/lifecycle model; exact fields unknown.
- Domain env snapshot is runtime artifact, not editor source.

    ## Authorization behavior
    Admin only. Hide panel for member. Backend authorizes every lifecycle/config action. Domain ownership ACL is deferred/unknown.

    ## UI states
    - Loading: domain summary skeleton.
- Empty: no domains with verified next action.
- Error: safe request error/retry.
- Unauthenticated: shell redirect.
- Forbidden: no panel/direct route forbidden.
- Success: domain summary with status labels.

## UI parity
- Confirmed: architecture documents domain runtimes and lifecycle as backend-owned control plane.
- Unknown: exact frontend domain registry endpoint shapes. Capture OpenAPI/runtime before wiring.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Settings panel, not dashboard: flat list rows, status badge/text, small actions.', 'Keep configuration details read-only until exact write contract confirmed.', 'Do not show raw domain env/secret values.']

    ## Acceptance criteria
    - Use no domain endpoint until contract captured. Start with read-only adapter interface.
- Domain action buttons delegate to lifecycle feature; no inline orchestration.

    ## Tests
    - Member cannot access panel.
- Admin sees each verified domain status.
- No domain API/field guessed.
- Running-domain config warning renders only when API supplies state.

    ## Files to create
    - Success: admin list fixture.
- Validation: n/a read-only first pass.
- Unauthenticated: protected dialog blocked.
- Unauthorized: member 403/direct route forbidden.
- Network/API: retry state.
- Edge: domain disappears while dialog open -> safe refresh/empty.

    ## Files to modify
    - `features/settings/domains/DomainsPanel.tsx`
- `features/settings/domains/api.ts`
- `features/settings/domains/types.ts`
- `tests/settings/domains.test.tsx`

    ## Deliberately not added
    - Settings route registry

    ## Dependencies
    - Domain editor based on `domain.env`.
- Lifecycle implementation.
- Graph renderer.
- ACL system.

    ## Evidence / verification
    - 03 App Shell.
- 14 Domain Lifecycle for actions.
