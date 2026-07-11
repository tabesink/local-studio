# ID-A - admin diagnostics (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/03-contracts/api/context-engine-v1.md`, `specs/05-quality/observability.md`, `specs/05-quality/security-and-privacy.md`, `specs/01-product/roles-and-permissions.md`, `specs/02-architecture/component-boundaries.md`.

**Question:** Can P8 expose LightRAG/provider diagnostics through a simple admin proxy route?

## Decision

No. If diagnostics ship in P8, the route must be explicitly contracted, admin-only, bounded, redacted, audited, and resolved through backend-owned P3/P5 boundaries.

API-001 only names an optional route today:

```text
GET /admin/domains/{domain_id}/diagnostics/lightrag?tail=200
```

That is not enough to implement.

## Why

| Bad path | Good path |
| --- | --- |
| Browser passes a path, URL, container id, provider target, or runtime address. | Browser passes only approved route params; server resolves target. |
| Route dumps raw runtime/provider output. | Response is capped and redacted. |
| Diagnostics are unaudited because they are "just ops". | Every diagnostics read writes an audit event. |
| Diagnostics becomes a support-data export path. | P8 has bounded admin read only. |

## Contract Patch Needed

Patch API-001 before route code:

| Surface | Needed decision |
| --- | --- |
| query | `tail` default/max and validation errors |
| response | exact safe DTO fields |
| cap | max lines and max bytes |
| redaction | what is stripped/masked and how tests prove it |
| boundary | P3 controller, P5 client, or P8 adapter over those services |
| audit | event name and target |
| errors | unknown domain, unavailable diagnostics boundary, invalid tail, forbidden member |

Do not expose runtime URLs, paths, container names, provider payloads, raw LightRAG hits, stack traces, source text, prompts, answers, or credential material.

## Implement Order

1. Patch API-001 with the diagnostics contract or mark the optional route deferred.
2. Patch QA-003 with redaction/cap proof.
3. Add AuditEventName for diagnostics read.
4. Implement server-side target resolver through existing private boundaries.
5. Apply cap before response serialization.
6. Apply redaction before response serialization and before fixtures.
7. Add authz, bounds, redaction, audit, and OpenAPI tests.

## Red Flags In PR

- Request accepts `path`, `url`, `container`, `port`, `provider`, `runtime`, or similar private target fields.
- Response includes raw runtime/provider strings that are not redacted.
- The route is not audited.
- Member receives diagnostics data.
- A diagnostics failure returns stack trace, path, runtime URL, provider payload, or raw exception text.
- Implementation imports Docker/LightRAG details into the API route instead of a service boundary.

## Tests

- Member receives canonical forbidden/unauthenticated behavior.
- Invalid `tail` fails before private boundary access.
- Response is bounded by the approved cap.
- Redaction fixture strips unsafe patterns without storing raw sensitive examples.
- Diagnostics read writes one audit event.
- OpenAPI snapshot includes only the approved DTO.

## One-line summary

Diagnostics is not a proxy; it is an audited safe read over backend-owned private state.
