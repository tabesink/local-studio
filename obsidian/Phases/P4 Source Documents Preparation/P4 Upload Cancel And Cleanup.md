---
type: flow
phase: P4
feature: F-004
status: active
layer:
  - api
  - worker
spec: specs/04-features/F-004-source-documents-preparation/spec.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p4
  - feature/f-004
  - type/flow
  - layer/api
  - layer/worker
  - status/active
---

# P4 Upload Cancel And Cleanup

**P4 has no "cancel upload" API.** Upload is one synchronous `POST`. **Cancel** applies to **preparation after upload succeeds**.

Parent: [[P4 Source Upload Flow]]. Storage: [[P4 Private Storage Rules]]. Prep ops: [[Source Preparation Operations Table]].

---

## Two "In Flight" Cases

```text
CASE A — HTTP upload still streaming (POST not finished)
  Admin closes tab / aborts request / network drops
  -> NO cancel endpoint; upload just fails

CASE B — Upload succeeded; worker parsing (prep op queued|running)
  Admin calls POST .../sources/{source_id}/cancel
  -> cancels PREPARATION, not the upload stream
```

---

## Case A: Upload Interrupted

**May exist:** temp file on private disk.  
**Does NOT exist:** `source_documents` row, prep operation, Source Blocks, parser-native payload.

```text
stream to TEMP -> hash/size -> DB txn (source + queued op) -> move to final -> commit
```

On failure before commit:

```text
rollback DB (if opened)
delete temp (+ final if partially moved)
no product rows
```

Parse never starts. Parser-native shapes not involved.

---

## Case B: Cancel After Upload

Already exists:

```text
source_documents (pending)
source_preparation_operations (queued | running)
original file on private disk
```

`POST .../cancel`:

```text
preparation_generation += 1
active prep op -> cancelled
```

| Worker state | Result |
| --- | --- |
| **queued**, unclaimed | Op cancelled; source stays `pending`. Retry or delete. |
| **running**, parsing | PreparedSource is ephemeral; stale worker publishes **zero rows** on gen mismatch. |
| **already prepared** | Cancel returns **409 source_state_conflict**. Use delete. |

Parser JSON never persisted — memory only, discarded if publish blocked.

---

## Timeline

```text
UPLOAD (sync — no cancel API)
  [streaming]--X abort     -> temp deleted, no DB rows
  [streaming][commit OK]   -> pending + op queued
                                  |
PREP (cancel API applies)         v
                            [queued] --cancel--> op cancelled, gen++
                            [running] --cancel--> gen++; publish 0 rows
                            [prepared] --cancel--> 409
```

---

## Cleanup Summary

| Event | DB | Files | Parser payload |
| --- | --- | --- | --- |
| Upload abort / fail | no rows (or rollback) | delete temp/final | n/a |
| Prep cancel (before publish) | op cancelled; no blocks | original kept | discarded in worker |
| Prep cancel (after publish) | 409 — already prepared | n/a | n/a |
| Source delete | hard-delete rows | delete original + images | n/a |

Full removal: `DELETE` source (or domain delete) — cancel active prep, delete files, hard-delete rows.

---

## Junior Checklist

1. **Cancel upload** = failed/aborted HTTP — not a product endpoint.
2. **`POST /cancel`** = cancel **preparation**, not multipart stream.
3. **Parser output always ephemeral** — cancel during parse means don't publish.
4. **Upload failure** = delete temp file + no DB rows.
5. **Prep cancel** = `preparation_generation` fence; no partial blocks.
6. **Full removal** = source/domain delete.

---

## Related

- [[P4 Source Upload Flow]]
- [[P4 Private Storage Rules]]
- [[Source Documents Table]]
- [[Source Preparation Operations Table]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
