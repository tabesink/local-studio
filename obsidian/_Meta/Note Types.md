---
type: meta
status: active
tags:
  - type/meta
  - status/active
---

# Note Types

| Type | Where | Example |
| --- | --- | --- |
| Index / MOC | root or phase folder | `P4 Index` |
| Readiness | phase folder | `F-004 P4 Readiness` |
| Flow | phase folder | `P4 Source Upload Flow` |
| Table / entity | phase folder | `Source Blocks Table` |
| Architecture | `Architecture/` or phase | `Private Storage Rules` |
| Implementation summary | phase folder | `P4 Implementation Summary` |
| ID-A slice | `Reviews/` | `ID-A Parser Adapters` |
| Review gate | `Reviews/` | `F-004 P4 Reconciled Design Gates` |
| Prompt kit | `Prompts/` | `Phase Implementation Summary Prompt` |
| Scratch | `Inbox/` | `Todo` |
| Meta | `_Meta/` | `Groups And Tags` |

## Frontmatter

Required: `type`, `status`. Add `phase`, `feature`, `spec` when scoped.

Optional: `layer`, `contract`, `audience`, `lifecycle`, `tags`.

Full schema: [[Groups And Tags]]

## Related

- [[Vault Conventions]]
- [[Groups And Tags]]
- [[Obsidian Vault Setup Guidelines]]
