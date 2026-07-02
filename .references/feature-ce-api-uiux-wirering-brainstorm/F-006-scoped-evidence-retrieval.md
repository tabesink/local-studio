# F-006 — Scoped Evidence Retrieval

**Phase P6 · Member endpoint · UI slice 12 (evidence panel)**

## Outcome

One domain-scoped question → safe evidence cards. **No synthesis.**

## API Surface

| Method | Route | Body |
| --- | --- | --- |
| POST | `/domains/{domain_id}/evidence` | `{ "question": "..." }` |

## Response Shapes

```text
200  { evidence: [ { excerpt, sourceLabel, ... } ] }   ← safe fields only
409  no eligible sources in domain
200  { code: "no_grounded_context" }                   ← hits discarded
```

Never in response: source/block UUIDs, raw scores, LightRAG payloads, paths.

## Retrieval Pipeline (server)

```text
question + domain_id
  → query eligibility check (P5 predicate)
  → LightRAGClient.retrieve()  [private]
  → parse CE_BLOCK markers
  → map to Source Blocks
  → discard bad/foreign/ineligible hits
  → return safe Evidence DTO
```

## UI Wiring (P9 slice 12)

Evidence renders **before** answer tokens in chat turn. Also usable standalone for debug/admin.

```text
Chat turn layout:
┌─────────────────────────────────┐
│ User question                   │
├─────────────────────────────────┤
│ Evidence cards (compact rows)   │  ← RightDetailPanel on click
│  • excerpt…  [source label]     │
├─────────────────────────────────┤
│ (answer stream — P7)            │
└─────────────────────────────────┘
```

| State | UI |
| --- | --- |
| loading | compact spinner in evidence slot |
| no_grounded_context | `PageState` empty — "No matching evidence" |
| 409 | explain domain has no eligible sources |
| success | list of excerpt cards |

## LS refs

- evidence rows: dense `ListRow` like logs entries
- detail panel: `ui/right-detail-panel.tsx` for full excerpt
- mono for source labels only where DTO allows

## Never

- source navigation (blocked until slice 16 opaque ref contract)
- client-side retrieval params (top-k, mode)

## Spec

`specs/04-features/F-006-scoped-evidence-retrieval/spec.md`
