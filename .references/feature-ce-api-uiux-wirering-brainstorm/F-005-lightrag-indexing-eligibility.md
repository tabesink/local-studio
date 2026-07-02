# F-005 — LightRAG Indexing & Query Eligibility

**Phase P5 · Admin index control · extends slices 09–10, 15**

## Outcome

Prepared sources → private LightRAG → `index_state: ready`. Server predicate for eligibility.

## API Surface

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `.../sources/{id}/index/retry` | re-queue index |
| POST | `.../sources/{id}/index/cancel` | cancel index |

Index fields live on source DTO (`indexState`, safe error). No separate index history table.

## Index State Machine

```text
not_requested → queued → submitting → accepted → ready
                      ↘ failed
accepted|ready|failed|cancelled → queued (retry)
queued|submitting|accepted|ready → cancelling → cancelled
```

## Query Eligibility (server only)

```text
source_is_query_eligible(source, domain) =
  domain available (P3)
  AND source.state == prepared
  AND source.index_state == ready
  AND generation/request id current
  AND no delete/cancel fence
```

**Frontend:** display `indexState` from API. Do not reimplement predicate.

## UI Wiring

Extend document row with **second status axis**:

```text
[dot] report.pdf
      prep: prepared  |  index: ready ✓
      prep: prepared  |  index: submitting …
      prep: failed    |  index: —
```

| indexState | Tone | Admin actions |
| --- | --- | --- |
| failed | danger | Retry |
| submitting/accepted | info | Cancel |
| ready | good | — |
| cancelled | default | Retry |

## Never

- poll LightRAG directly
- show request ids, content hashes, remote ids
- mark chat-ready from prep alone

## LS refs

- dual status: two `StatusPill`s inline
- progress: `ui/progress-bar.tsx` during submitting

## Spec

`specs/04-features/F-005-lightrag-indexing-eligibility/spec.md`
