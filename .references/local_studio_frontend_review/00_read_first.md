# 00 — Read First: Scope, Rules, Read Order

## Goal

Build Context Engine vertical slices. Make each slice visually feel Local Studio. Keep Context Engine RAG product meaning.

```text
Copy visual grammar.
Do not copy unrelated runtime.
```

## Read order

1. `README.md`
2. `00_review_baseline.md`
3. `00_visual_parity_and_ownership.md`
4. `contracts/01_current_context_engine_api.md`
5. `contracts/02_current_sse_contract.md`
6. Requested vertical slice doc.
7. Related Local Studio capability doc only when future feature becomes approved.

## Hard rules

```text
FastAPI owns auth, roles, domain access, lifecycle, retrieval, evidence,
provider config, jobs, operations.

Frontend owns visual state, selected detail, composer text, active request,
theme, rail state.

Document != filesystem file.
Chat turn != durable conversation.
Domain != agent workspace.
Evidence != copied document content.

No credential in localStorage/sessionStorage/URL.
One API contract.
One SSE parser.
One token system.
```

## KISS / YAGNI / DRY check

Before adding code, answer:

| Check | Pass condition |
|---|---|
| Current need | User-facing slice needs it now. |
| Owner | One service/component owns mutable state. |
| Contract | Pydantic/OpenAPI shape named. |
| Reuse | Existing Local Studio primitive works, or one narrow variant needed. |
| Deferred complexity | Agent/terminal/filesystem/session code remains absent. |
| Test | Behavior observable in API and UI test. |

Fail any row -> stop. Write decision. Do not add framework.

## Visual rule

Local Studio tokens/primitives first. Use compact dark-first workstation grammar:

```text
left rail | work canvas | optional right inspector
Geist / Geist Mono
24px or 28px dense rows
quiet surfaces
1px borders
monochrome primary action
status dot/pill
right detail panel
```

No dashboard card grid. No default blue shadcn primary. No terminal-looking fake UI.

## Source links inside package

Every slice ends with source paths. Paths are evidence map, not promise exact symbols still exist. Verify before editing.
