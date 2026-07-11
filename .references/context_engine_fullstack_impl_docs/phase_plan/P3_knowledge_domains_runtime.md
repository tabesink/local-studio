# P3 - Knowledge Domains And Private Runtime

Goal: admin can create, start, stop, inspect, and hard-delete empty Knowledge Domains with isolated private LightRAG runtimes.

## Build

- `domains`.
- `domain_operations`.
- `runtime_instance_id` private identity.
- `control_generation` fencing.
- private domain controller with Docker socket.
- token-auth internal controller routes.
- deterministic runtime naming policy.
- private workspace/log/runtime DB per domain instance.
- member available-domain list.
- one worker path for async domain delete completion.

## State

Persist only:

```text
stopped | running | deleting
```

Operation types:

```text
create | start | stop | delete
```

Availability is computed:

```text
state == running
AND no active operation
AND fresh private health is healthy
```

Do not persist `available`, `starting`, `failed`, `archived`, or runtime health enum.

## Do Not Build

- browser UI
- documents/source prep/indexing
- provider calls
- runtime URL in DB/API
- runtime manifest/env/Compose
- archive/restore
- repair/recreate/regenerate action
- status poller
- generic operation framework
- API Docker socket
- public runtime port

## API Contract

```text
POST   /api/v1/admin/domains
GET    /api/v1/admin/domains
GET    /api/v1/admin/domains/{domain_id}
GET    /api/v1/admin/domains/{domain_id}/status
POST   /api/v1/admin/domains/{domain_id}/start
POST   /api/v1/admin/domains/{domain_id}/stop
DELETE /api/v1/admin/domains/{domain_id}
GET    /api/v1/admin/domains/{domain_id}/operations
GET    /api/v1/domains
```

Member route returns available domains only:

```json
{ "domains": [{ "id": "fatigue", "displayName": "Fatigue Analysis", "available": true }] }
```

Admin responses never include `runtimeInstanceId`, controller payload, container ID, runtime URL, path, DB name, or provider config.

## Delete Contract

`DELETE` returns `202`.

Flow:

```text
lock domain
-> state=deleting
-> insert delete operation
-> worker/controller remove container/runtime DB/workspace/logs
-> verify absence
-> delete domain row
-> later GET returns 404
```

Partial failure stays `deleting`. Admin repeats DELETE to resume.

## Test Gate

- domain create validates embedding profile.
- create provisions empty storage/runtime DB but no provider call.
- start creates private runtime with no host port.
- member sees only available running healthy domain.
- stop removes runtime container.
- delete removes container, runtime DB, workspace, logs, domain row, operation rows.
- same public ID can be reused only after delete complete.
- old instance action cannot affect reused ID.
- API has no Docker socket.
- controller has no host-published port.

## Handoff

P4 can place source storage under domain instance root and block upload/retry when domain is deleting.

