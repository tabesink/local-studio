# Simplification Audit — Keep / Replace / Defer

| Finding | Current evidence | Decision | Validation |
|---|---|---|---|
| Bearer token in `localStorage` | client API/auth store uses access-token key | **Replace** with cookie-only session | browser storage test |
| Local-only logout | client logout resolves without backend route | **Replace** with server logout | replay old cookie after logout |
| Full app shell client boundary | AppLayout/client providers handle auth + route redirect | **Simplify** to server-first route group where deployment allows | route/hydration test |
| Global Settings dialog | one dialog contains panel routing | **Keep concept; split panels** | keyboard/focus/role tests |
| Document state vs operation state | docs define two state machines | **Keep separation** | upload/operation fixture |
| LightRAG direct responsibility | architecture assigns retrieval to LightRAG, synthesis to Context Engine | **Keep boundary** | chat trace |
| `/retrieve` vs chat SSE | retrieval evidence-only; chat stream for answer | **Keep distinct contracts** | endpoint contract tests |
| Jobs visible as product surface | docs call jobs internal; operations canonical | **Remove from user-facing scope** | route audit |
| Provider/profile secret fields | backend intends secret status only | **Keep boundary** | payload snapshot/redaction test |
| Generic global state manager | not required by confirmed flows | **Do not add** | module import audit |
| WebSocket migration | SSE exists and meets current chat path | **Defer** | only revisit if SSE requirement fails |
| ACL expansion | per-document/domain ACL deferred | **Defer** | product policy + backend design first |

## Non-negotiable rules

- Shared UI primitives never call API.
- Feature UI never decides authorization.
- API DTOs are not DB models.
- Frontend status labels use one map per entity.
- No mock persistence disguised as product behavior.
- Unknown contract -> fixture + capture task, not guess.
