# Evidence Map

## Source areas reviewed

| Area | Evidence focus | Confidence |
|---|---|---|
| `docs/architecture.md` | topology, ownership, status/lifecycle, chat, security | Confirmed docs; runtime verify |
| `docs/design.md` | visual direction, rail/settings layout | Confirmed docs; browser verify |
| `api/main.py` | router composition/CORS | Confirmed |
| `api/routes/auth.py` | login cookie + `/auth/me` | Confirmed |
| `api/routes/chat.py` | capability, stream route, duplicate guard | Confirmed |
| `api/routes/users.py` + schemas | admin user contracts | Confirmed |
| `api/routes/ai_settings.py` + schemas | provider contracts/secrets | Confirmed |
| `api/routes/document_parser_settings.py` + schemas | parser contracts | Confirmed |
| document/operation schemas | status fields/transitions | Confirmed docs/source |
| `client/src/app/*` | routes and provider composition | Confirmed |
| `client/src/components/layout/*` | rail/layout | Confirmed |
| `client/src/components/settings/SettingsDialog.tsx` | dialog/nav/focus/accessibility | Confirmed |
| `client/src/lib/api/*` | client transports, local token behavior, SSE parser | Confirmed |

## Known source-path observations

- Settings dialog route IDs observed: `general`, `account`, `knowledge-graph`, `provider`, `document-parsing`.
- Provider/parser nav is admin-filtered in dialog.
- Current route named “Users” maps to `account` panel. Treat actual intended user-management behavior as API-driven, not label-driven.
- SSE client reads event stream incrementally and has bounded line/buffer behavior. Preserve explicit parser tests.
- Architecture docs call `/operations` canonical product API; jobs internal.

## Runtime capture checklist

Capture before changing contracts:
1. `POST /auth/login` success/failure headers/body.
2. `GET /auth/me` cookie-only and bearer-only.
3. admin/member responses for each admin endpoint.
4. document list/upload and status transitions.
5. operation list/detail and cancel/retry behavior.
6. chat capability and raw SSE transcript for every terminal path.
7. provider/parser validation/test errors.
8. graph/domain lifecycle response models.
