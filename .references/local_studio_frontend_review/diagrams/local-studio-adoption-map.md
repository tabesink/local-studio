# Local Studio Adoption Map

| Context Engine slice | Local Studio reference | Reuse | Exclude |
|---|---|---|---|
| Shell | `features/shell`, `ui/page` | rail, header, density, page states | agent nav/session nav |
| Settings | `features/settings`, `ui/settings` | section nav, rows, controls | controller runtime targets semantic model |
| Chat | `features/agent/ui/chat-pane` | composer/thread/status/inspector grammar | Pi runtime, tools, session replay |
| Library/source nav | `ui/table`, `list`, `right-detail-panel`, file visual patterns | dense rows, inspector, copyable metadata | host filesystem mutation |
| Lifecycle/jobs | `ui/status`, `progress-bar`, logs patterns | status/progress/detail/error grammar | model engine process lifecycle |
| Graph | agent canvas panel visual framing | canvas chrome, inspector | browser/computer tool |
| Audit | `features/logs`, `features/usage` | list/filter/diagnostic surface | Local Studio controller metrics ownership |

Rule: reuse UI primitive/pattern. Reimplement Context Engine data behavior against FastAPI.
