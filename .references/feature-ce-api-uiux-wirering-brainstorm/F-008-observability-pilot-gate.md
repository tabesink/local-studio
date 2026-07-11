# F-008 — Observability & Pilot Gate

**Phase P8 · Admin diagnostics · UI slice 17**

## Outcome

Safe audit trail, structured logs, optional tracing. **No behavior change** to P1–P7.

## API Surface

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/admin/audit-events` | immutable audit read |
| GET | `/admin/domains/{id}/diagnostics/lightrag?tail=200` | bounded diagnostics (optional) |

## Audit Event Shape (safe)

```text
timestamp, event name, actor id, resource type/id, safe metadata
NEVER: prompts, answers, source text, secrets, paths, raw payloads
```

## UI Wiring (slice 17)

```text
/operations or Settings → Audit
├── filterable table (event, actor, resource, time)
└── row click → RightDetailPanel with safe metadata JSON (mono, bounded)
```

Diagnostics: admin-only, tail-limited, redacted log lines in mono container.

## Pilot Gate Flow (QA, not UI)

```text
auth → domain create/start → upload → prepare → index → evidence → chat → delete/redact
```

Load: 5–10 concurrent users. Prove SSE, worker, provider timeout paths.

## LS refs

- logs table: `features/logs/logs-view.tsx`, `logs-sessions-sidebar.tsx`
- mono payloads: `ui/markdown-content.tsx` or quiet `<pre>` with token colors

## Never

- full prompt/answer tracing in UI
- Langfuse UI embedded in product
- client-driven diagnostic paths/URLs

## Spec

`specs/04-features/F-008-observability-pilot-gate/spec.md`
