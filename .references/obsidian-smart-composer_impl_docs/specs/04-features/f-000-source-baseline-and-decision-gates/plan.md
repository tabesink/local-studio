---
id: F-000-PLAN
title: Source Baseline and Decision Gates implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Plan

## Goal

The team can reproduce the reviewed reference and knows which source capabilities may or may not be transferred.

## Implementation steps

1. Clone the reference at the pinned commit.
2. Verify `LICENSE`, `package.json`, `manifest.json`, and source tree against `SOURCE_PIN.md`.
3. Record any ref drift in the decision log.
4. Confirm source-only and target-only responsibilities before feature code starts.

## Exact target areas expected to change

### Frontend

- `specs/07-traceability/source-feature-map.md` updates only if drift exists.
- No product code.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Revert documentation-only changes; do not change target runtime.

## Risks and decisions

A later source ref invalidates static claims; re-audit selected paths before copying.

## Coding-agent work packet

### Objective

The team can reproduce the reviewed reference and knows which source capabilities may or may not be transferred.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Clone the reference at the pinned commit.
2. Verify `LICENSE`, `package.json`, `manifest.json`, and source tree against `SOURCE_PIN.md`.
3. Record any ref drift in the decision log.
4. Confirm source-only and target-only responsibilities before feature code starts.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- Pinned source is reproducible.
- Target team agrees that source is a reference—not a backend dependency.
- Open decisions have owners.

### Validation commands

```bash
git clone https://github.com/glowingjade/obsidian-smart-composer.git obsidian-smart-composer-reference
```
```bash
git -C obsidian-smart-composer-reference checkout 6b38ab3c57e03c5c6cbeb79815277857df59cbd8
```
```bash
git -C obsidian-smart-composer-reference rev-parse HEAD
```
