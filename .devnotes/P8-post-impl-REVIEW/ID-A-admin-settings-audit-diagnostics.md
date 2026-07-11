# ID-A - admin settings, audit, and diagnostics (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-009-frontend-delivery/spec.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/05-quality/observability.md`, `specs/01-product/roles-and-permissions.md`, `specs/04-features/F-010-shared-node-operations/` when formalized.

**Question:** Can P9 use P8 observability work to build a full admin logs/usage/operator dashboard?

## Decision

No. P9 may render captured admin Settings panels and the P8 safe audit/diagnostics routes. Logs/Usage/cost/storage/node dashboards and Docker environment controls are F-010 scope.

Settings must be split by ownership:

```text
personal preferences
admin provider/model/parser/runtime/domain/source settings
reserved post-P9 node/workspace sections
```

Reserved means not a working control unless an approved contract exists.

## Why

| Bad path | Good path |
| --- | --- |
| Use P8 logs as product data. | Use P8 audit_events as audit truth and diagnostics as bounded admin read. |
| Show raw runtime/log/provider details in UI. | Render only API-001 safe DTOs. |
| Put node URLs/ports/API keys in settings. | Backend-owned Runtime Node work belongs to F-010. |
| Hide admin controls and skip backend 403 tests. | UI hides for usability; backend authorization remains final. |
| Merge personal prefs and infrastructure mutation in one panel. | Split by ownership and role. |

## Approved P9 Admin Surfaces

| Surface | Endpoint gate | UI rule |
| --- | --- | --- |
| Users | P1 admin users route | Admin-only; safe user fields only. |
| Provider credentials | P2 provider route | Masked input; response shows `isConfigured`, never value. |
| Model profiles | P2 model routes | Safe model metadata only. |
| Parser setting | P2 runtime setting and P4 parser state | No provider payload display. |
| Domains | P3 admin domain routes | State/availability from DTO only. |
| Sources | P4/P5 source/index routes | Safe source/index fields only. |
| Audit events | P8 audit route | Admin-only table/detail over safe fields. |
| LightRAG diagnostics | P8 diagnostics route | Admin-only bounded redacted lines, if available. |

## Deferred Or Blocked

| Surface | Owner |
| --- | --- |
| Logs viewer | F-010 |
| Usage/cost accounting | F-010 |
| Storage summaries | F-010 |
| Runtime Node selection/control | F-010 |
| Docker environments | F-010 |
| Workspace settings/tool registries | Product model not approved |
| Wiki creation/review/publish | F-011 |
| Smart Composer durable writes | F-011 |

## Implement Order

1. Implement role-aware Settings shell from old CE structure.
2. Add personal preferences as UI-local state only.
3. Wire P2 runtime settings with masked credential form.
4. Wire P3/P4/P5 domain/source admin panels only through captured wrappers.
5. Add audit events table from `GET /admin/audit-events`.
6. Add diagnostics read only from `GET /admin/domains/{domain_id}/diagnostics/lightrag`.
7. Keep F-010/F-011 sections absent or explicitly reserved/inactive.
8. Add member/admin screenshots and backend 403 tests.

## Red Flags In PR

- Settings displays credential values or raw controller/API key material.
- UI accepts controller URL, host path, runtime port, container id, provider target, or storage target.
- Audit table includes usernames, emails, filenames, titles, questions, answers, source content, provider payloads, private ids, or stack traces.
- Diagnostics route accepts a browser-provided path/URL/target.
- Member can navigate to working admin settings through client routing.
- Node/logs/usage/storage controls mutate anything in P9.
- Audit/diagnostics data is cached as product truth.

## Tests

- Member cannot see admin panels and receives 403 if route/action is attempted.
- Admin provider credential form never displays credential value after save.
- Audit table renders safe event fields and request id filters.
- Audit default list handles self-read rows per API-001.
- Diagnostics success shows bounded redacted lines.
- Diagnostics unavailable shows safe error only.
- Settings screenshots show personal/admin/reserved ownership separation.
- Static/network audit confirms no private infrastructure calls from browser code.

## One-line summary

P9 admin UI renders captured safe controls; it does not turn P8 observability into an operations platform.
