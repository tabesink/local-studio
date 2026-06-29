# Slice 08 — Settings Dialog — Document Parser

    ## User outcome
    Admin selects/configures/tests parser profile with safe secret status; document pipeline reads resulting backend configuration.

    ## In scope
    - Admin-only Parser panel.
- Load `GET /admin/document-parser-settings`.
- Render active profile and profile list; edit only documented config.
- Submit settings/profile mutation through one parser API module.
- Run profile test with explicit pending/result state.

    ## Explicitly out of scope
    - Document upload UI.
- Parser runtime implementation.
- Secret value display.
- Automatic migration of old documents.
- Generic parser marketplace.

    ## Routes affected
    - global Settings dialog section `document-parsing`

    ## Frontend modules
    - `features/settings/parsers/ParserPanel.tsx`
- `ParserProfileForm.tsx`
- `api.ts`
- `types.ts`

    ## API contracts consumed
    - `GET /admin/document-parser-settings`
- `PUT /admin/document-parser-settings`
- `POST /admin/document-parser-settings/profiles/{id}/test`

    ## Data models
    - Parser profile: id, provider, display/base URL, api-key env/status, enabled/active/config.
- Settings: active profile + profile list + secret status.

    ## Authorization behavior
    Admin only. Backend enforces provider/parser config and any secret storage. Member hidden/forbidden. Parser test response may contain vendor detail: render safe summary only.

    ## UI states
    - Loading: parser setting skeleton.
- Empty: no parser profile / no active profile.
- Error: retryable safe alert.
- Unauthenticated: login redirect.
- Forbidden: panel/route forbidden.
- Success: active profile badge + saved state.
- Test: pending/complete/error inline.

## UI parity
- Confirmed: v1 exposes parser settings GET/PUT and profile test endpoint.
- Confirmed: architecture documents seeded Docling Local/Reducto Cloud concepts and secret status-only UI.
- Verify exact create/delete/activate subroutes; not all were proven in static read.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Same Settings rail/panel geometry as Provider.', 'Profiles show active/enabled state in text badge.', 'Config form shows only verified fields; advanced JSON only when existing contract supplies structured config.']

    ## Acceptance criteria
    - Keep parser profile wire mapping isolated.
- Upload feature reads resulting document processing state, not parser form local state.

    ## Tests
    - Admin sees configured/not configured secret status only.
- Changing active profile refreshes read model.
- Profile test result is visible, safe, and does not leak key.
- Member cannot reach API/UI.

    ## Files to create
    - Success: load/save/test fixture.
- Validation: invalid parser config response maps to form.
- Unauthenticated: session expiry handling.
- Unauthorized: member 403.
- Network/API: test failure/retry.
- Edge: active profile deleted/disabled response produces clear no-active state.

    ## Files to modify
    - `features/settings/parsers/api.ts`
- `types.ts`
- `ParserPanel.tsx`
- `ParserProfileForm.tsx`
- `tests/settings/parsers.test.tsx`

    ## Deliberately not added
    - Settings route registry

    ## Dependencies
    - Document ingest implementation.
- Secret retrieval.
- Parser plugin layer.
- Auto reindex.

    ## Evidence / verification
    - 03 App Shell.
- 10 Upload for downstream use.
