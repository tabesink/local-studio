# Route + Screen Inventory

| Route/surface | Purpose | Auth / role | Primary UI | API / state | Rebuild slice |
|---|---|---|---|---|---|
| `/` | Redirect entry | public | redirect | client/router | 01 |
| `/login` | Credential entry | public | login form | `/auth/login`, `/auth/me` | 02 |
| app shell | persistent rail, toast, Settings trigger | authenticated | compact rail + content region | session state | 03 |
| Settings: General | user preferences/basic config surface | authenticated | dialog panel | settings UI state | 04 |
| Settings: Users | admin user management | admin | dialog table/form | `/admin/users*` | 05 |
| Settings: Domains / Knowledge Graph | admin domain config | admin | dialog panel | domain APIs | 06 |
| Settings: Model Provider | provider profiles/secret status | admin | dialog panel | `/admin/ai-settings*` | 07 |
| Settings: Document Parser | parser profiles/test | admin | dialog panel | `/admin/document-parser-settings*` | 08 |
| `/documents` | document library | authenticated read; admin write | table/list/detail affordances | document APIs | 09 |
| Upload workflow | upload + operation tracking | admin | upload dialog/progress | `/admin/documents/upload`, operations | 10 |
| `/chat` | chat shell | authenticated | conversation/composer | capability + chat stream | 11 |
| Chat streaming/evidence | partial answer + source/evidence | authenticated | streaming message/source blocks | SSE | 12 |
| `/database-visualize` | knowledge graph inspect | authenticated/admin behavior verify | graph workspace | graph proxy APIs | 13 |
| Domain lifecycle | start/stop/delete/recreate operations | admin | lifecycle controls | LightRAG domain APIs | 14 |
| Operations | global lifecycle visibility/recovery | admin | operations table/detail | `/operations*` | 15 |
| Workspace context/source nav | context/evidence/source display | authenticated | split/side panel | docs/evidence | 16 |
| Audit/diagnostics | admin observability | admin | logs/status pages | audit/health/ops APIs | 17 |

## Existing app shell — Confirmed

```text
Root provider composition
  ├── auth bootstrap
  ├── AppLayout
  │   ├── narrow left SideRail
  │   └── route content
  ├── global SettingsDialog
  └── toaster
```

## Direct route rule — Recommendation

- No session -> redirect to `/login?next=<safe-path>`.
- Session exists, role insufficient -> render `/forbidden` or in-place forbidden panel. Do not redirect to hidden arbitrary route.
- Backend returns `401` -> clear local session state, redirect login.
- Backend returns `403` -> preserve route, show forbidden state, log safe request ID.
