# Logs

Status: partial future mockup. P8 audit API exists; broader log viewer is F-010 deferred.

## Purpose

Admin/operator observability surface for audit events and optional bounded diagnostics. Logs are diagnostic evidence, not audit truth.

## Specs

- `specs/04-features/F-008-observability-pilot-gate/spec.md`
- `specs/05-quality/observability.md`
- `specs/03-contracts/api/context-engine-v1.md` P8 routes
- `DESIGN.md`

## Frontend Module

`src/features/logs/`

## Reference Targets

- `.references/feature-ce-api-uiux-wirering-brainstorm/F-008-observability-pilot-gate.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-009-frontend-slices.md` slice 17
- `.references/code/local-studio-codebase/frontend/src/ui/table.tsx`
- `.references/code/local-studio-codebase/frontend/src/ui/right-detail-panel.tsx`

## Wiring Pack Notes

```text
slice 17 -> audit/diagnostics table
P8 -> no behavior change to P1-P7
pilot gate -> auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact
```

## ASCII Mockup

```text
/operations/logs or settings diagnostics
+--------------------------------------------------------------------------------+
| Observability                                      [Audit] [Diagnostics]        |
|--------------------------------------------------------------------------------|
| filters: eventName [v] actorKind [v] targetId [......] requestId [......]      |
|--------------------------------------------------------------------------------|
| createdAt            eventName                 actor          target   outcome |
| 2026-07-06 12:00     domain.delete_queued      admin          domain   ok      |
| 2026-07-06 11:58     security.admin_denied     member         route    denied  |
| 2026-07-06 11:53     audit_events.read         admin          audit    ok      |
|--------------------------------------------------------------------------------|
| right detail: safe metadata only; no source text, prompt, answer, paths.        |
+--------------------------------------------------------------------------------+

diagnostics tab:
+---------------------------------------------------------+
| Domain [manuals v]  kind: lightrag  tail [100] [Fetch]  |
|---------------------------------------------------------|
| 12:00 redacted diagnostic line                          |
| 12:00 redacted diagnostic line                          |
+---------------------------------------------------------+
```

## Wiring

| Surface | API |
| --- | --- |
| Audit table | `GET /api/v1/admin/audit-events` |
| Diagnostics tail | optional `GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag?tail=100` |

Audit filters allowed by API-001:

```text
limit, cursor, eventName, actorKind, targetKind, targetId,
requestId, traceId, createdFrom, createdTo, includeSelfReads
```

## Parity Rules

- Use `Table`, `SearchInput`, compact selects, and right detail panel.
- Log lines and request/trace ids use Geist Mono.
- Use safe `StatusPill` for `succeeded`, `failed`, `denied`.
- Keep row height dense; preserve geometry during loading.

## Do Not Wire

- No raw stdout browser tail unless F-010 approves a safe route.
- No raw exception, stack trace, raw request body, filenames, titles, source text, prompt, answer, evidence excerpt, provider payload, runtime target, storage target, credential, IP, or user agent.
- No browser-supplied path, URL, container, provider, runtime, or storage target.
