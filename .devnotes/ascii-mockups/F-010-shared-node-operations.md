# F-010 Shared Node Operations

Status: deferred contract mockup.

## Purpose

Future shared-mode Runtime Node operations: safe node status, node environments, diagnostics, logs, usage, storage summaries, and operator controls.

No approved F-010 feature files were present in this checkout. Treat this file as a stop-sign mockup, not implementation authority.

## Specs

- `README.md` P10 build-order row
- `CONTEXT.md` Runtime Node and Node Environment vocabulary
- `specs/04-features/F-009-frontend-delivery/spec.md` F-010 out-of-scope list
- `specs/04-features/F-008-observability-pilot-gate/spec.md` deferral notes
- `DESIGN.md`

## ASCII Mockup

```text
future /operations
+--------------------------------------------------------------------------------+
| Node operations                                      [Refresh]                  |
|--------------------------------------------------------------------------------|
| Runtime nodes                                                                  |
| status  node id     engines        envs    last heartbeat    action            |
| good    node-a      ollama/vllm    4       12:04             Details           |
| warn    node-b      vllm           1       12:01             Details           |
|--------------------------------------------------------------------------------|
| Node environments                                                              |
| status  recipe/image        node     lifecycle       safe operational status    |
| good    llama-runtime       node-a   running         healthy                    |
| info    embedding-runtime   node-a   starting        pending                    |
|--------------------------------------------------------------------------------|
| right detail: safe facts, bounded logs, admin actions when contracted           |
+--------------------------------------------------------------------------------+
```

## Required Future Contracts

Before implementation, promote API/data contracts for:

```text
RuntimeNode safe DTO
NodeEnvironment safe DTO
node lifecycle/status endpoints
bounded node diagnostics/logs
usage/cost/storage summaries
role and audit rules
failure/rollback behavior
```

## Parity Rules

- Use tables, fact rows, right detail panel.
- Status dot/pill plus text.
- Mono for node ids, environment ids, timestamps, image names when safe.
- Destructive actions require confirmation modal and backend audit.

## Do Not Wire

- No browser controller URL, runtime URL, Docker socket, host path, node credential, API key, runtime port, local filesystem path, browser cost/storage calculation, or local node cache.
- No Local Studio terminal/filesystem/Git/browser-agent panels.
- No mock node data presented as working product behavior.
