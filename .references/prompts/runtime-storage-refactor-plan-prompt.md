Review the attached **Per-Domain LightRAG Runtime and Storage Refactor** plan alongside the latest Knowledge Domain and Document Ingestion refactor decisions.

I like the current direction, but I am concerned that the proposed storage/runtime boundaries may still be more elaborate than necessary for a 5–10 user internal application.

Your task is to produce a **leaner revision of the runtime and storage boundary** that preserves all required functionality while removing unnecessary directories, records, services, abstractions, lifecycle steps, and operational debt.

## Core question

Challenge the current design rather than preserving it by default:

> What is the smallest safe filesystem, Docker mount, runtime-binding, logging, and cleanup design that still provides strict per-domain isolation, host-visible persistence, reliable restart/delete behavior, and clean ownership boundaries?

Do not retain a separation merely because it is architecturally neat. Retain it only when it prevents a concrete security, data-loss, cross-domain, recovery, or maintainability failure.

## Product constraints that must remain

* One private LightRAG runtime and one private LightRAG workspace per Knowledge Domain.
* Context Engine owns:

  * domain registry and lifecycle;
  * raw uploaded documents;
  * parser execution and normalization;
  * canonical parsed manifests;
  * figures, tables, images, and other source artifacts;
  * source-aware index units;
  * source preview and evidence navigation;
  * authorization and safe deletion orchestration.
* LightRAG owns:

  * embeddings;
  * vector/KV/graph persistence;
  * entity and relation extraction;
  * post-handoff indexing;
  * semantic and graph retrieval.
* The browser must never access Docker, private LightRAG endpoints, host paths, runtime credentials, or secrets.
* Persistent data must remain host-visible beneath one `.data/` root.
* Each LightRAG runtime must mount only the files it genuinely needs.
* A stopped domain must restart with its retrieval workspace intact.
* Domain deletion must safely remove or explicitly archive all domain-specific source, artifact, runtime, and retrieval data without touching another domain.
* Provider credentials, database passwords, JWT secrets, and other secrets must not be stored in generated domain files, logs, or host-visible runtime folders.
* Do not introduce Kubernetes, object storage, a workflow engine, event bus, monitoring stack, log sidecars, or a new microservice unless there is a verified need.

## Specific tensions to resolve

Evaluate whether the current two-root layout is truly necessary:

```text
.data/domains/<domain-id>/
.data/lightrag/<domain-id>/
```

versus a simpler single domain root such as:

```text
.data/domains/<domain-id>/
  source/
  derived/
  runtime/
  workspace/
  logs/
  tmp/
```

A single root is acceptable only if Docker mounts remain narrow enough that LightRAG receives access solely to its own `workspace/` and, if needed, `logs/`.

Determine whether the following are genuinely required or can be simplified or removed:

* separate `runtime.json`;
* separate generated `compose.yaml` per domain;
* separate domain-local logs and global logs;
* `recovery/` directory;
* `tmp/upload`, `tmp/parse`, and `tmp/handoff` subdirectories;
* persisted domain-local runtime diagnostics;
* separate runtime-binding table versus fields on the domain record;
* separate lifecycle operation records versus existing operations/audit infrastructure;
* archive folder layout and archive mechanics;
* explicit workspace key, runtime key, and service name fields;
* low-frequency availability polling versus on-demand health probes;
* separate deployment-control service versus a narrowly scoped existing backend control path.

## Required output

Produce a replacement document titled:

```text
Context Engine — Lean Per-Domain Runtime and Storage Boundary
```

Include:

1. **Decision summary**

   * State the simplest recommended model.
   * Explicitly identify what was removed from the prior design and why.

2. **Final filesystem tree**

   * Use the smallest practical `.data/` layout.
   * Label each directory as required, optional, derived, temporary, or deferred.

3. **Ownership and mount matrix**

   * Show exactly which process owns each directory.
   * Show exactly which directories each container may mount.
   * Confirm that LightRAG cannot access raw sources, parser artifacts, sibling domains, global app data, or Docker controls.

4. **Minimal runtime model**

   * Define only the fields that must persist in the application database.
   * Clearly separate canonical database state from derived runtime files.
   * Avoid duplicate registries and duplicated mutable state.

5. **Lifecycle behavior**

   * Create, start, stop, delete, archive, restart, and failed-start handling.
   * Keep only the required steps.
   * Show which steps are idempotent and how partial failure is recovered.

6. **Logging and diagnostics**

   * Recommend the smallest safe observability design.
   * Separate required lifecycle/audit records from optional file logs.
   * Do not make raw runtime logs a required dependency for core status reporting.

7. **Simplification review**

   * For every retained directory, model, service, or operation, explain the specific risk it prevents.
   * For every removed element, explain why functionality is preserved.
   * Flag any unresolved tradeoff honestly.

8. **Migration outline**

   * Give the smallest safe migration path from the current v1 layout.
   * Include one pilot-domain validation sequence and rollback point.

9. **Explicit non-goals**

   * List the infrastructure and abstractions deliberately excluded.

## Evaluation standard

Prefer:

* one canonical database source of truth;
* deterministic paths derived from stable internal domain IDs;
* one clear deletion owner;
* direct, understandable Docker bind mounts;
* simple restart behavior;
* low operational burden;
* no hidden coupling between source storage and LightRAG workspace storage.

Do not optimize for theoretical future multi-tenancy or scale that this product does not currently need.

End with a direct recommendation answering:

> Should Context Engine use one unified per-domain filesystem root or separate Context Engine and LightRAG sibling roots, and what is the leanest safe reason for that choice?
