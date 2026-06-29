# Slice 17 — Audit + Diagnostics

    ## User outcome
    Admin investigates safe operation/audit/health signals without exposing secrets, stack traces, private documents, or worker internals.

    ## In scope
    - Create admin diagnostics summary linked from Operations/settings only after verified endpoints.
- Render safe audit event rows: actor/action/target/time/allowed metadata.
- Render health/dependency status if endpoint exists.
- Add request ID copy affordance for support only if returned by API.
- Redact known secret/token/header field names in client display as defense-in-depth.

    ## Explicitly out of scope
    - Full log tail.
- Provider prompt/completion capture.
- Raw stack traces.
- Secret inspection.
- SIEM integration.
- Client-side audit source truth.

    ## Routes affected
    - admin diagnostics/audit route or panel

    ## Frontend modules
    - `features/diagnostics/DiagnosticsPage.tsx`
- `AuditTable.tsx`
- `HealthSummary.tsx`
- `api.ts`
- `redaction.ts`

    ## API contracts consumed
    - Audit/log/health endpoints — exact paths/models **verify before implementation**.

    ## Data models
    - Audit event likely actor/event/target_id/metadata/created_at per architecture; exact DTO/access policy verify.
- Health summary DTO unknown.

    ## Authorization behavior
    Admin only by default. Backend decides audit visibility. Client redaction is backup, not data control. Never make raw log transport part of common UI.

    ## UI states
    - Loading: summary/table skeleton.
- Empty: no events.
- Error: safe error + retry.
- Forbidden: no data.
- Success: safe event/status rows.
- Degraded: health/status explanation without provider secrets.

## UI parity
- Confirmed: v1 architecture describes audit logging for destructive/admin actions and app logging limitations.
- Unknown: exact audit/health endpoints and data retention. Contract capture gate.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Dense support table, clear timestamp/action/target.', 'Use monospaced IDs only in secondary/copyable detail.', 'Metadata collapsed and redact before render.']

    ## Acceptance criteria
    - Keep diagnostics adapter separate from operations adapter.
- Redaction function handles display only; backend response must already be safe.
- No polling faster than actual operational need.

    ## Tests
    - Admin sees only verified safe audit/health fields.
- Sensitive-looking metadata is redacted in UI test fixtures.
- Member gets forbidden.
- Request ID support flow works without copying secret payload.

    ## Files to create
    - Success: safe audit/health fixtures.
- Validation: n/a read-only.
- Unauthenticated: redirect.
- Unauthorized: 403.
- Network/API: retry.
- Edge: metadata contains token/key/header-like field; UI redacts.

    ## Files to modify
    - `features/diagnostics/api.ts`
- `redaction.ts`
- `DiagnosticsPage.tsx`
- `AuditTable.tsx`
- `HealthSummary.tsx`
- `tests/diagnostics/redaction.test.ts`

    ## Deliberately not added
    - admin route/nav config

    ## Dependencies
    - Log tail.
- Raw trace viewer.
- Telemetry platform.
- Secret inspect.
- Background monitoring agent.

    ## Evidence / verification
    - 15 Operations Recovery.
- 07 Security/Auth.
