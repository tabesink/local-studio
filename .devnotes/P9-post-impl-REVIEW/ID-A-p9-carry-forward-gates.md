# ID-A - P9 carry-forward gates (junior dev explainer)

Parent links: [ID-A.md](./ID-A.md), [F-010-P10-readiness.md](./F-010-P10-readiness.md)

**Question:** What P9 work is safe to rely on for P10, and what must stay blocked?

### Decision

Rely on the P9 foundation only:

```text
T-000 docs gate
T-010 runtime/API/storage/token foundation
T-020 cookie auth wrappers and route guards
T-030 authenticated shell, rail, Settings entry, safe states
```

Do not rely on full P9 delivery. It is still in progress.

### Why

| Safe for P10 | Still blocked |
| --- | --- |
| `/login` route exists. | Live backend browser auth flow pending. |
| Shared API client uses credentials and same-origin paths. | OpenAPI fixture strategy for later panels still gates new wrappers. |
| Storage allowlist is tested. | Settings admin panels are unavailable. |
| Rail order and route shell are tested. | Chat streaming UI waits for EVT-001 transcripts. |
| API-unavailable error is safe. | Documents preview blob/source-ref/graph data contracts are missing. |

P10 can make the foundation interactive by starting the backend. It must not hide the fact that P9 chat/documents/graph features remain contract-gated.

### Exact Carry-Forward Matrix

| Surface | P9 state | P10 action |
| --- | --- | --- |
| Auth client | foundation implemented | Prove against live API. |
| `/login` | implemented | Use as frontend smoke target. |
| `/chat` route | shell route exists | Do not claim streaming chat UI. |
| `/documents` route | shell route exists | Do not claim upload/preview wiring. |
| `/database-visualize` route | shell route exists | Do not claim graph data. |
| Settings | personal shell + admin unavailable state | Do not add node/operator controls before contracts. |
| Visual acceptance | build passes, screenshot matrix pending | Run screenshots only for P10 UI surfaces if added. |

### Implement Order

1. In P10 implementation responses, say "P9 foundation only" when relying on frontend.
2. Use `/login` and `/api/v1/auth/me` for stack smoke.
3. Keep chat/documents/graph assertions out of first P10 smoke.
4. Do not wire Settings panels or node sections as part of stack startup.
5. Update F-009 evidence only if P10 actually proves a pending F-009 item, such as live auth.

### Red Flags In PR

- F-009 is marked implemented because P10 stack starts.
- Chat SSE assertions are added without EVT-001 transcript fixtures.
- Documents preview fetch uses guessed or old reference endpoint.
- Evidence source links expose private source/block IDs.
- Graph route renders real data without approved DTOs.
- Settings adds node/runtime/log/usage controls before contracts.

### Tests

- Re-run `npm.cmd run test:foundation`.
- Re-run `npm.cmd run typecheck`.
- Keep P10 smoke focused on health/auth/proxy.
- If live auth proof is captured, update F-009 acceptance for AC-002/AC-003 only with exact evidence.
- Do not update blocked P9 acceptance rows without their required fixtures/screenshots/contracts.

### One-line summary

P10 can stand on P9's shell and API-client foundation, but it cannot turn that foundation into a full P9 completion claim.
