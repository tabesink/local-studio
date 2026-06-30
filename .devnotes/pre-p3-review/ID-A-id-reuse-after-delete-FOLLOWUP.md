## Terse EXPLAIN

**Hard delete frees slug** — When delete finishes, the `domains` row is removed (not archived). The slug is no longer reserved, so `CREATE fatigue` with the same slug is allowed.

**Recreate gets fresh identity** — That INSERT is a new row, not a revival of the old one:
- `runtime_instance_id = uuid-B` (new UUID; not `uuid-A`)
- `control_generation = 1` (reset; does not continue from the pre-delete bump)

**Stale workers fail fence** — Every mutating UPDATE must match **both** `runtime_instance_id` and `control_generation` on the row. A worker still holding `uuid-A` / gen `1` (or gen `2` from delete-accept) hits a row with `uuid-B` / gen `1` → **0 rows updated** → safe no-op; no corruption of the new domain.

**Why two fields:**
- **Generation bump** on delete accept → kills in-flight ops that started before delete
- **New instance id on recreate** → even if slug repeats, old controller/worker cannot target the new row

```text
Old worker: WHERE slug=fatigue AND runtime_instance_id=uuid-A AND control_generation=1
New row:    runtime_instance_id=uuid-B, control_generation=1
→ mismatch → 0 rows → stale work discarded
```