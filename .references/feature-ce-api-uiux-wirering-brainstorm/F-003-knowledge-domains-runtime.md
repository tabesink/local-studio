# F-003 — Knowledge Domains & Private Runtime

**Phase P3 · Admin lifecycle + member list · UI slices 06, 11, 14**

## Outcome

Isolated LightRAG runtime per Knowledge Domain. Members see **available** domains only.

## API Surface

| Method | Route | Role |
| --- | --- | --- |
| POST | `/admin/domains` | admin create |
| GET | `/admin/domains` | admin list |
| GET | `/admin/domains/{id}` | admin detail |
| GET | `/admin/domains/{id}/status` | admin poll (lean) |
| POST | `.../start`, `.../stop` | admin lifecycle |
| DELETE | `/admin/domains/{id}` | admin async delete |
| GET | `/admin/domains/{id}/operations` | admin history |
| GET | `/domains` | member+admin **available only** |

## Domain State Machine

```text
stopped ──start──► running ──stop──► stopped
   │                  │
   └──delete──────────┴──delete──► deleting ──worker──► (removed)
```

`available` = computed at read (running + no active op + healthy). **Not stored.**

## UI Wiring

| Slice | Screen | Pattern |
| --- | --- | --- |
| 06 | Settings → Domains | `ListRow` + `StatusDot`; mono slug id |
| 11 | Chat domain selector | `ui/select.tsx`; data from `GET /domains` |
| 14 | Domain lifecycle admin | start/stop/delete + confirm modal |

```text
Domain row:
[StatusDot] displayName          embeddingProfileId (mono)
            fatigue              openai-embedding-default
            [Start] [Stop] [Delete]
```

## Hidden from API/UI forever

`runtimeInstanceId`, container id, runtime URL, paths, DB names.

## Polling

Use `GET .../status` for active operations (delete). Do not invent client lifecycle.

## LS refs

- list density: `features/recipes/recipes-content/recipe-row.tsx`
- delete confirm: `ui/model-stop-confirm.tsx` pattern (quiet danger)

## Spec

`specs/04-features/F-003-knowledge-domains-runtime/spec.md`
