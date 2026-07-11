# Shell

Status: implementation handoff draft.

## Purpose

Authenticated app frame, compact rail, global settings dialog, loading/error/forbidden states.

## Contract Note

The `/chat` mockup below is a proposed three-panel chat shell change. Current F-009 text still says two-column `LightRagChatShell`; promote this layout into `specs/04-features/F-009-frontend-delivery/` before implementing.

## Specs

- `specs/04-features/F-009-frontend-delivery/spec.md`
- `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`
- `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md`
- `DESIGN.md`

## Reference Targets

- `.references/ce-local-studio/webui/src/features/navigation/AppShell.tsx`
- `.references/ce-local-studio/webui/src/features/navigation/SideRail.tsx`
- `.references/code/local-studio-codebase/frontend/src/ui/button.tsx`

## Wiring Pack Notes

Folded from `.references/feature-ce-api-uiux-wirering-brainstorm/00-system-wiring-map.md`, `02-ce-client-port-map.md`, and `F-009-frontend-slices.md`.

```text
slice 01 -> typed API client + error envelope
slice 02 -> login/logout
slice 03 -> shell + settings entry
```

Keep CE nav order from the port map:

```text
Chat -> Library/Documents -> Knowledge graph -> Settings dialog -> Logout
```

`Library/Documents` still maps to `/documents` unless F-009 explicitly renames the label. The `/chat` route may add its own left `Chats/Wiki` panel, but the global shell rail remains the only app-level navigation.

## ASCII Mockup

```text
+----------------------------------------------------------------------------+
| app background: --ui-bg, p-3/4/5                                             |
| +-- workframe -------------------------------------------------------------+ |
| | rail | route canvas                                                       | |
| | 48px |                                                                  | |
| |------+------------------------------------------------------------------| |
| | CE   | /chat, /documents, /database-visualize, /operations               | |
| |      |                                                                  | |
| | msg  | route owns its own header/content/detail panel                    | |
| | lib  |                                                                  | |
| | net  | forbidden route renders in canvas, no redirect loop                 | |
| | ops* |                                                                  | |
| |      |                                                                  | |
| | sun  | bottom tools: theme, settings dialog                                | |
| | gear |                                                                  | |
| +------+------------------------------------------------------------------+ |
+----------------------------------------------------------------------------+

settings overlay:
+----------------------+------------------------------------------------------+
| Settings             | active section title                                |
| general              | SettingsFactRows / SettingsGroup                    |
| users*               | compact rows, masked secrets, no paths/URLs         |
| domains*             |                                                      |
| providers*           | [Save] [Test when contracted]                       |
+----------------------+------------------------------------------------------+

/chat route proposed three-panel shell:
+--------------------------+---------------------------------------+------------------------------+
| Context Engine           | Main Chat                             | Right Workbench              |
| [ Chats ] [ Wiki ]       | Domain: Damper Faults                 | [ Evidence ] [ Composer ]    |
|--------------------------+---------------------------------------+------------------------------|
| + New chat               | User                                  | Evidence for selected turn   |
| Search chats             | Why is this damper failing?           |                              |
|                          |                                       | [D1] Test report p.8         |
| Today                    | Assistant                             | [W1] Wiki v4 claim           |
| - Damper failure triage  | The likely issue is...                | [F1] Field note              |
| - Supplier comparison    |                                       | [T1] Team decision           |
|                          | [Use in Smart Composer]               |                              |
|                          |                                       |                              |
|                          | Ask follow-up...                [^]   |                              |
+--------------------------+---------------------------------------+------------------------------+
```

`*` admin-only. Members do not see admin rail items or admin settings sections.

## Wiring

| UI event | API/contract |
| --- | --- |
| App boot | `GET /api/v1/auth/me` |
| Unauthenticated | route to `/login`, no rail |
| Member opens admin path | render forbidden state; backend still returns 403 |
| Logout | `POST /api/v1/auth/logout`, clear session state once |
| Settings open | local UI state only; no route navigation |
| Library nav | route to `/documents`; label may render as Library while contract path stays `/documents` |

## State

```text
session: loading | authenticated | unauthenticated | error
settings: { open, activeSection }
route access: backend authz truth; frontend only hides obvious controls
```

## Parity Rules

- Keep compact icon rail geometry. Do not replace with a wide Local Studio sidebar.
- `/chat` route may add an inner left work panel after the 48px rail; keep it compact and tabbed (`Chats` / `Wiki`).
- Do not move Chat, Library/Documents, Graph, or Settings into the `/chat` left panel.
- Active nav uses selected surface plus 2px left accent.
- Icon-only buttons need labels/tooltips.
- Workframe is one structural panel, not nested page cards.
- Use `--shell-rail-compact` or 48px, `--ui-rail`, `--ui-border`, `--ui-selected`.

## Do Not Wire

- No browser token storage.
- No runtime/controller/provider URLs.
- No browser-side role authority beyond hiding controls.
- No F-010 node/workspace settings as working controls in P9.
