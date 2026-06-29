# 03 — Future Capability Boundary

## Rule

Future compatibility = stable naming, IDs, ownership. Not placeholder system.

| Capability | Keep now | Do not build now | Trigger |
|---|---|---|---|
| Agent runtime | Domain ID, `turn_id`, typed event parser | `AgentRun`, tool registry, agent loop | Approved multi-step tool-use need |
| Terminal | Nothing beyond security design note | terminal route, xterm, shell command field | Approved isolated execution use case |
| Filesystem/artifacts | Stable Document/evidence IDs | host file browser, `agentfs`, artifact table | Approved generated-file workflow |
| Durable sessions | Opaque current turn ID | session table/history nav/replay | Explicit retention/history requirement |
| Plugin/skills | Existing UI primitive reuse only | plugin framework | At least one real extension contract + owner |

## Future models: names only

```text
AgentRun
ToolRun
TerminalRun
WorkspaceArtifact
ConversationSession
ConversationTurn
```

Do not create table, route, client type, nav item, or empty feature folder now.

## Future security gate

Before agent/terminal/filesystem starts:

```text
Product requirement.
Threat model.
Tenant/domain/workspace ownership.
Server isolation design.
Allowlist.
Audit fields.
Output limit.
Timeout.
Cancellation.
Deletion/retention policy.
API contract.
Integration test.
Manual abuse test.
```

## Critical distinctions

```text
Document = RAG source material.
WorkspaceArtifact = future generated output.
Host filesystem = server execution substrate.
ConversationSession = persisted ordered turn collection.
AgentRun = future tool-using runtime.
ChatTurn = current one request/one answer.
```
