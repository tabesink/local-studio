# Usage

Status: deferred implementation mockup.

## Purpose

Future usage/cost reporting by safe backend dimensions. Not P9 scope and not available from P8 core contracts.

## Specs

- `specs/04-features/F-008-observability-pilot-gate/spec.md`
- `specs/05-quality/observability.md`
- F-010 shared-node-operations deferred until API/data contracts are promoted.
- `DESIGN.md`

## Frontend Module

`src/features/usage/` after F-010 contracts exist.

## Reference Targets

- `.references/feature-ce-api-uiux-wirering-brainstorm/F-008-observability-pilot-gate.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-009-frontend-delivery.md`
- `.references/code/local-studio-codebase/frontend/src/ui/table.tsx`
- `.references/code/local-studio-codebase/frontend/src/ui/fact-grid.tsx`

## Wiring Pack Notes

P8 creates safe trace/log/audit metadata but does not create Usage UI or cost accounting. Keep usage reporting behind F-010 API/data contracts.

## ASCII Mockup

```text
/usage (future)
+----------------------------------------------------------------------------+
| Usage                                                range [7d v] [Export]  |
|----------------------------------------------------------------------------|
| summary rows                                                                |
| chat turns        124        evidence retrievals      310                  |
| provider calls     88        cost status              reported/estimated   |
|----------------------------------------------------------------------------|
| by model/profile                                                            |
| profile                 calls   input tok   output tok   cost      status   |
| openai-synthesis-default  42     120k        18k          $--       reported |
| bedrock-synthesis-a       18      55k         8k          n/a       unavailable|
|----------------------------------------------------------------------------|
| detail panel: event summary, request id, safe status                         |
+----------------------------------------------------------------------------+
```

## Intended Wiring

Do not implement until F-010 defines Usage Event API/data contracts. Expected safe dimensions:

```text
time range
actor kind / safe actor id when approved
domain id
node id
provider kind
model profile id
operation kind
reported | estimated | unavailable cost status
```

## Current Boundary

P8 allows safe trace metadata and logs, but it does not add Usage UI, cost accounting, query logs, or browser-computed storage/cost.

## Parity Rules

- Use tables and fact rows, not KPI card grid.
- Mono for model/profile ids, token counts, durations, request ids.
- Cost status uses text plus dot/pill.
- Keep unavailable cost explicit; do not invent estimates in browser.

## Do Not Wire

- No browser-side token/cost calculation as product truth.
- No query logs table assumption.
- No raw prompt, answer, source text, evidence excerpt, provider payload, stack trace, path, runtime URL, or credential in usage rows.
