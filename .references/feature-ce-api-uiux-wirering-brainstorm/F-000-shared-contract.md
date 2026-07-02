# F-000 — Shared Contract

**Phase P0 · Spec-only · No UI**

## Outcome

One spine: vocabulary, boundaries, build gates, contract precedence.

## Wiring

```text
specs/ + CONTEXT.md + DESIGN.md + AGENTS.md
         │
         └──► every later phase reads these before coding
```

## Junior Checklist

- [ ] Read `CONTEXT.md` vocabulary (Knowledge Domain, Source Document, Evidence…)
- [ ] Confirm browser never talks to LightRAG/DB/storage/providers
- [ ] Know build order P1→P9
- [ ] Unknown contract → fixture task, not guessed code

## UI Impact

None directly. `DESIGN.md` locks Local Studio parity for P9.

## Spec

`specs/04-features/F-000-shared-contract/spec.md`
