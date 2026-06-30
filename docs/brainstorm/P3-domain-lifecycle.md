# P3 - Domain Lifecycle And Private Runtime

Status: PLANNED

## Context Packet

Build the domain registry and private runtime lifecycle. Admins can create, start, stop, inspect, and hard-delete empty isolated LightRAG runtimes.

Read first: `docs/backend/p0-shared-contract.md`, `docs/backend/p3-domain-lifecycle-plan.md`.

## Previous Slice Provides

P2 provides encrypted config, model profiles, immutable embedding-profile references, and private resolver validation.

## This Slice Changes

- add `domains` and `domain_operations`;
- add runtime naming policy and generation fencing;
- add private domain controller with token auth and fixed actions;
- add worker delete-completion path;
- add admin domain routes and member available-domain list;
- add async hard delete with verified runtime/container/DB/storage cleanup.

## This Slice Must Not Rework

- API must not mount Docker socket;
- browser never sees runtime instance ID, runtime URL, paths, DB names, or controller details;
- no provider calls;
- no documents/sources/indexing;
- no archive/restore, status poller, generic jobs table, or runtime manifest/env file.

## Next Slice Can Assume

P4 can store source files under the domain-instance data root and can block uploads while a domain is deleting.

## Acceptance Criteria

- migration `0003` runs after P1/P2.
- domain create validates embedding profile and provisions empty storage/DB.
- start creates private runtime with no host port and verifies health.
- stop removes runtime container while keeping allowed persistent runtime storage.
- member list returns only available domains.
- delete returns `202`, worker completes cleanup, and row disappears.
- repeated delete resumes after partial failure.
- same public domain ID can be recreated only after hard delete and gets a new private instance.
- tests prove API has no Docker socket and controller exposes no public port.

