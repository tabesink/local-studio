---
type: lesson
status: active
audience:
  - junior-dev
lifecycle: building
tags:
  - type/lesson
  - status/active
---

# Git Branching For Feature Slices

Terse git workflow for vertical-slice development: one branch per slice, commit as you go, merge one at a time.

Parent: [[Lessons Index]].

---

## Goal

After this lesson you can:

- branch correctly for one feature slice;
- commit incrementally on that branch (not only at the end);
- open a PR, merge into `main`, and start the next slice;
- avoid branch clutter without losing history.

---

## Why this matters

Context Engine is built **one vertical slice at a time** (`AGENTS.md`). Git should mirror that:

| Git thing | Slice meaning |
| --- | --- |
| Branch | Isolated workspace for one slice |
| Commit | Saved checkpoint inside that slice |
| PR + merge | Ship completed slice into `main` |

Waiting until several branches are done and committing only the latest branch loses reviewable history and makes merges painful.

---

## Mental model

```text
main
 ├── feature/settings-panel   → PR → merge → delete
 ├── feature/chat-streaming   → PR → merge → delete
 └── feature/wiki-crud        (in progress)
```

**Rule:** Branch = isolate. Commit = save. Merge = ship. Delete = clean up.

Not this (chained unfinished work):

```text
main → feature-a → feature-b → feature-c
```

Only chain when slice B **cannot** start until unfinished slice A lands.

---

## Walkthrough

### 1. Start a slice

```bash
git switch main
git pull
git switch -c feature/settings-panel
```

### 2. Build in small steps — commit each step

```bash
git add .
git commit -m "Add settings panel layout"

git add .
git commit -m "Wire settings form to API"
```

Many small commits on one branch beat one giant final commit.

### 3. Push and open PR

```bash
git push -u origin feature/settings-panel
```

Open PR → review → tests pass → merge into `main`.

### 4. Clean up merged branch

```bash
git switch main
git pull
git branch -d feature/settings-panel
git push origin --delete feature/settings-panel
```

Enable **GitHub → Settings → Pull Requests → Automatically delete head branches**.

### 5. Start next slice from updated `main`

```bash
git switch main
git pull
git switch -c feature/chat-streaming
```

### Branch naming

```text
feature/settings-ui
feature/settings-api
fix/login-redirect
refactor/provider-adapter
```

Prefix = intent. Name = what changed.

---

## Checkpoint questions

1. Do you commit on every branch, or only the latest branch after several are done?
2. Where should `feature/chat-streaming` branch from — `main` or an unmerged `feature/settings-panel`?
3. After a PR merges, should the feature branch stay on GitHub forever?
4. What is better on one branch: five small commits or one huge commit at the end?
5. Roughly how many **active** branches should a healthy repo have at once?

---

## Mini exercise

You are implementing F-010 worker slice, then F-012 chat layout slice.

Write the exact command sequence (8–12 lines) for:

1. Finish worker slice on `feature/runnable-workers`, push, merge PR.
2. Delete the merged branch locally and on origin.
3. Start chat layout on `feature/chat-workbench-layout` from fresh `main`.

---

## Expected answer

```bash
# On feature/runnable-workers — commits already made during implementation
git push -u origin feature/runnable-workers
# open PR, review, merge into main

git switch main
git pull
git branch -d feature/runnable-workers
git push origin --delete feature/runnable-workers

git switch -c feature/chat-workbench-layout
# implement chat layout; commit as you go
git push -u origin feature/chat-workbench-layout
```

Key points: commits happened **during** the worker branch, not deferred; next branch starts from **updated** `main`, not from the old feature branch.

---

## Common mistakes

| Mistake | Reality |
| --- | --- |
| “I’ll commit when all three branches are done” | Each branch owns its commits as you build |
| Branch B from unmerged branch A | Creates hard-to-merge dependency chains |
| Keep 100 stale branches on GitHub | Normal to *create* many over time; delete merged ones |
| One giant commit per slice | Hard to review, bisect, and revert |
| Never push until “perfect” | Push for backup, review, and CI — merge when slice is done |

---

## Related

- [[Lessons Index]]
- [[Backend-Owned Lifecycle]] — what a “slice” means in CE (workers, leases)
- [[Build Order Index]] — phase order for slice sequencing
- [[Guidelines Index]] — repo conventions

## Repo sources

- `AGENTS.md` — one vertical slice at a time; spec-driven workflow
- `specs/04-features/` — each feature folder is a slice candidate
- `docs/plans/` — implementation plans per slice
