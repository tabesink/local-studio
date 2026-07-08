# ce-code-review — Junior Dev Cheat Sheet

**What:** Deep, multi-reviewer code review of a git diff. Not a quick lint pass.

**When:** Before opening a PR on sensitive/large work (auth, migrations, public APIs). Skip for typos and tiny diffs — use the harness `/review` instead.

**Invoke:** `/ce-code-review` (current branch), `/ce-code-review 1234` (PR), `/ce-code-review base:origin/main`, `/ce-code-review plan:docs/plans/.../plan.md`

---

## What You Get Back

One report. Each finding has:

| Field | Meaning |
| --- | --- |
| `#N` | Stable id — cite this in commits/PR replies |
| **P0–P3** | Urgency (see below) |
| **autofix class** | What kind of follow-up (see below) |
| **evidence** | File:line + quote from the diff |
| **owner** | Who should fix it |

Findings may be grouped by theme (`grouping:auto`). Groups are triage lenses — still fix item-by-item.

---

## Severity — Fix Order

| Level | Meaning | Junior dev rule |
| --- | --- | --- |
| **P0** | Breaks prod, security hole, data loss | Stop. Fix before merge. |
| **P1** | Real bug or contract break | Fix in this PR unless explicitly deferred |
| **P2** | Should fix; tech debt / missing test | Fix or file ticket with `#N` |
| **P3** | Style, nit, FYI | Your call |

Two reviewers flagging the same issue → treated as higher confidence. Trust those first.

---

## Autofix Class — What To Do

| Class | Meaning | Your action |
| --- | --- | --- |
| `gated_auto` | Concrete fix suggested | Review suggestion. Apply if you agree. Interactive mode may already apply safe ones. |
| `manual` | Needs design / discussion | Do not blindly patch. Read evidence, ask senior, or split follow-up PR. |
| `advisory` | Report only | Read once. No code change required unless you want to. |

**Severity and autofix class are independent.** P1 can be `advisory`. P3 can be `gated_auto`.

---

## Two Modes

| Mode | Who runs it | Mutates code? |
| --- | --- | --- |
| **Interactive** (default) | You directly | Yes — applies safe fixes; may commit `fix(review):` on clean tree. **Never pushes.** |
| **`mode:agent`** | `/ce-work` or another skill | No — JSON report only. Caller applies. |

**Footgun:** Do not run interactive review on a checkout another agent is testing. Use `mode:agent` if tests run in parallel.

**Footgun:** Review never runs `git checkout`. PR/branch args pick *scope*, not your working tree.

---

## Pipeline (What Happens Under The Hood)

```text
1. Resolve diff     current branch vs origin/HEAD (or base: / PR metadata)
2. Intent summary   2–3 lines from commit messages
2b. Plan check      if docs/plans/* linked → verify Requirements + Implementation Units
3. Pick reviewers   6 always-on + extras matched to diff (auth → security, migration → data-migration, etc.)
4. Parallel review  each persona one lens; results merged
5. Synthesis        dedupe, drop out-of-scope, promote cross-persona agreement, route autofix
5c. Apply (interactive only) safe verified fixes
6. Report           markdown (you) or JSON (mode:agent)
```

**Always-on reviewers:** correctness, testing, maintainability, project-standards, agent-native, learnings-researcher.

**Conditional examples:** security (auth touched), data-migration (schema/migration files), performance (hot paths), API contract (OpenAPI/handlers), adversarial (CI gates that could lie about prod readiness).

---

## Residual Work Gate (After Review)

If not everything got fixed, you get a **Residual Actionable Work** list (`#N`, severity, file, title, autofix class).

Pick one:

1. **Apply now** — finish fixes in this branch
2. **File tickets** — one ticket per `#N`
3. **Accept** — record in PR description or `docs/residual-review-findings/<sha>.md` (findings cannot vanish into chat)
4. **Stop** — do not merge until P0/P1 resolved

---

## Protected Artifacts — Do Not Delete

Reviewers may suggest removing these. **Ignore those findings.**

```text
docs/brainstorms/*
docs/plans/*.{md,html}
docs/solutions/*
```

Pipeline decision artifacts. Not dead code.

---

## Quick vs Deep

| Ask | Tool |
| --- | --- |
| "quick review" / typo / small diff | Harness `/review` (ce-code-review short-circuits) |
| Auth, migrations, large diff, "review thoroughly" | `/ce-code-review` |

`/ce-work` Phase 3.3 auto-escalates to `ce-code-review mode:agent` when diff is sensitive, ≥400 lines diffuse, or ≥1,000 lines.

---

## Arguments Cheat Sheet

| Argument | Effect |
| --- | --- |
| _(empty)_ | Current branch vs detected base |
| `<PR # or URL>` | Review PR without checkout |
| `<branch>` | Review branch without checkout |
| `base:<ref>` | Current checkout vs that ref |
| `plan:<path>` | Requirements verification from plan |
| `mode:agent` | JSON only; no edits |
| `grouping:off` / `grouping:always` | Flat report / always group themes |

**Errors:** `base:` + PR/branch together. Conflicting mode or grouping flags.

---

## Reading A Report — Junior Dev Checklist

```text
1. Scan P0/P1 table first.
2. Read Applied section (interactive) — verify those diffs make sense.
3. For each gated_auto: open file:line, read evidence quote, apply or push back with reason.
4. For manual: do not patch alone — escalate or schedule.
5. Check plan verification section if present — "code looks fine" ≠ "matches plan".
6. Resolve residual list before merge (or accept with durable record).
7. Reference #N in commit messages: fix(review): #3 validate session cookie path
```

---

## Related Skills

| Skill | Use when |
| --- | --- |
| `/ce-work` | Full implement → review → fix loop |
| `/ce-doc-review` | Specs/plans, not code |
| `/ce-debug` | Root-cause bug hunt, not review |
| `/ce-resolve-pr-feedback` | After PR is open and humans comment |

---

## One-Line Summary

**ce-code-review** = diff-aware multi-reviewer pass with numbered P0–P3 findings, autofix routing, optional auto-apply, and a residual gate so nothing important disappears into chat.
