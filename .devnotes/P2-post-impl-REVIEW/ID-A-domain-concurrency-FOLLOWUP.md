# ID-A — Domain concurrency follow-ups (resolved)

Parent: [ID-A-domain-concurrency.md](./ID-A-domain-concurrency.md).

---

## Q: Do “domain ops” include upload / pipeline?

**No.** Only lifecycle: `create`, `start`, `stop`, `delete` on `domain_operations`.

Document prep and pipeline → F-004 `source_preparation_operations` (different system).

---

## Q: Can admin run 2–4 ops with the rest queued?

**No.** Max **one** active op per domain (`queued` or `running`).

Second request → **409 `domain_operation_in_progress`** immediately. Nothing waits in line.

---

## Q: What should admin see on 409?

**Toast** with a clear reason — not silent failure, not “queued” wording.

- Use API safe `error.message`, or fixed copy + active op type when available (`activeOperation.operationType` from status poll).
- Example intent: *“Start already in progress for this domain. Wait for it to finish.”*

Full UX rule: [ID-A-domain-concurrency.md § Admin UI — toast on blocked second op](./ID-A-domain-concurrency.md).
