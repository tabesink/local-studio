# Feature Specifications

One feature folder equals one **vertical delivery slice**: a coherent user/business outcome that can be planned, built, tested, and demonstrated.

## Create a feature

```bash
cp -R specs/04-features/_template specs/04-features/F-001-short-name
```

Then replace placeholders and update the feature register.

## Required sequence

1. `spec.md` — behaviour, scope, rules, acceptance.
2. `ux.md` — visible flow/state contract where UI is involved.
3. `plan.md` — component/contract/data/test/deployment plan.
4. `tasks.md` — ordered implementation tasks.
5. `test-plan.md` — proof strategy.
6. `acceptance.md` — completion evidence.
7. `implementation-log.md` — material decisions, deviations, links to code/PRs.

## Feature size rule

Split a feature when it:
- has more than one independent user outcome;
- crosses unrelated bounded contexts;
- requires several independently deployable changes;
- cannot be demonstrated meaningfully in a review;
- needs large parallel agent work with unclear merge ownership.

A feature may touch frontend, API, data, worker, and observability layers when they jointly serve one user outcome. Do not split merely to preserve a technical layer boundary.
