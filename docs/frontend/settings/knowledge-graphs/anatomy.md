# Knowledge Graphs — anatomy

Target grammar (Controllers-style). ASCII only — adapt density from `environment-controls`, not from ad-hoc live markup.

## Settings content column

```
┌ SettingsLayout content ──────────────────────────────────────────┐
│ Section: Knowledge Graphs                                        │
│                                                                  │
│ ┌ SettingsGroup "Knowledge Graphs" ────────────────────────────┐ │
│ │ Lifecycle on backend. No Docker / port / URL details.        │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ ▸ Fatigue Manuals              [running]   [Stop]            │ │
│ │   fatigue                                                    │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ ▾ Homelab                      [stopped]   [Start]           │ │
│ │   homelab                                                    │ │
│ │   ┌ expanded (safe) ───────────────────────────────────────┐ │ │
│ │   │ Embedding: <profile label> · locked                    │ │ │
│ │   │ Storage                                 [near limit?]  │ │ │
│ │   │   28 MB of 5 GB                                        │ │ │
│ │   │   [████████░░░░] total ProgressBar                     │ │ │
│ │   │   optional component bars from storageSummary          │ │ │
│ │   │                                        [ Delete ]      │ │ │
│ │   └────────────────────────────────────────────────────────┘ │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ (empty) No Knowledge Graphs configured.                      │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌ SettingsGroup "New Knowledge Graph" (or Deploy footer) ──────┐ │
│ │ [name____] [id____] [embedding ▾]              [Deploy]      │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ SettingsNotice (danger/good) — safe copy only                    │
└──────────────────────────────────────────────────────────────────┘
```

## Collapsed row (target)

```
[chevron]  Display name                 [StatusPill]  [Start|Stop XOR]
           mono domain id
```

- One expanded row at a time (or collapse current).
- Storage bars are **not** drawn while collapsed.

## Expanded body (target)

```
Embedding (read-only / locked label)
Storage header + optional warning pill
  total / limit mono summary from storageSummary
  ProgressBar(totalPercent)
  optional closed component bars (source_storage / graph_index / database_metadata)
quiet Delete (confirm via UiModal)
```

## What is not drawn

- Host ports, runtime URLs, container ids, compose targets
- Storage filesystem paths
- Radio “active controller”
- Nested storage-breakdown chevrons (deferred unless a plan requires them)
