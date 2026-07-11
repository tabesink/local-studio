# ID-A — ID reuse after delete (junior dev explainer)

Part of **ID-A** working set. Parent: [ID-A.md](./ID-A.md). Concurrency fence: [ID-A-domain-concurrency.md](./ID-A-domain-concurrency.md).

**Question:** Delete `fatigue`, create `fatigue` again — same slug OK? What stops old worker touching new domain?

---

### Decision

**Hard delete** domain row → slug reusable.

New row → **new `runtime_instance_id`**, **`control_generation = 1`**.

Stale worker: mismatch on `runtime_instance_id` OR `control_generation` → **no-op / reject** (0-row UPDATE).

---

### Lifecycle

```text
CREATE fatigue
  runtime_instance_id = uuid-A
  control_generation  = 1

DELETE accepted
  control_generation += 1     # now 2 — invalidates in-flight work
  state → deleting
  insert delete op (control_generation_at_start = 2)

DELETE complete
  HARD DELETE domains row (+ CASCADE domain_operations)

CREATE fatigue again (same slug)
  NEW row
  runtime_instance_id = uuid-B   # not uuid-A
  control_generation  = 1        # reset, not continue from 2
```

No soft-delete / `archived` slug reservation in P3.

---

### Fencing pattern

Resource row owns monotonic **`control_generation`**. Industry fencing-token style.

```text
Worker (old delete, gen=1) tries UPDATE domains
  WHERE id=fatigue AND control_generation=1 AND runtime_instance_id=uuid-A
        │
        ▼
0 rows — domain gone OR gen bumped OR instance id wrong → safe no-op
```

Worker must pass **both** private fields on every mutating commit.

| Field | Role |
|-------|------|
| `runtime_instance_id` | New physical runtime identity per domain row lifetime |
| `control_generation` | Bumps on delete accept; invalidates pre-delete in-flight ops |

**Never expose** `runtime_instance_id` or `control_generation` in API DTOs / logs.

---

### Why both fields

- **Generation bump** → kills in-flight ops started before delete
- **New instance id on recreate** → old controller target cannot alias new domain even if slug repeats

---

### vs old server

Old had no generation fence, no stable private runtime instance id on domain row — greenfield adds both.

---

### Tests

- Delete complete → INSERT same slug succeeds
- New row has different `runtime_instance_id`, `control_generation = 1`
- UPDATE with stale generation → 0 rows, no state corruption
- UPDATE with wrong `runtime_instance_id` → 0 rows

---

### One-line summary

**Hard delete frees slug; recreate gets fresh `runtime_instance_id` and `control_generation = 1`; stale workers fail fence check and cannot mutate new row.**
