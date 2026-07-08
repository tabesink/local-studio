# Feature: Navigation Sidebar

## Purpose

The navigation/sidebar feature provides the persistent Local Studio workbench rail: primary route links, a new-chat shortcut, session search affordance, project/session navigation, collapse/expand, resize, and a mobile drawer. It is used by every authenticated/workbench route except setup/download/agents landing surfaces.

## Current Code Map

- `app/layout.tsx`: wraps app in `Providers` and `LeftSidebar`.
- `app/providers.tsx`: installs `ProjectsProvider`, `ToolsProvider`, and controller events listener.
- `features/shell/left-sidebar.tsx`: desktop sidebar, mobile drawer, active route logic, resize, search hotkey, active sessions listener.
- `store.ts`: persisted `desktopSidebarPinnedOpen`, `sidebarWidth`, `themeId`, `fontFamilyId`, `fontSizeId`.
- `features/agent/ui/projects-nav-section.tsx`: project/session section inside the sidebar.
- `features/agent/ui/sessions-command.tsx`: command/search overlay for sessions.
- `lib/workspace-events.ts`: `local-studio.agent.activeSessions`, `local-studio.agent.sessionsChanged`.

## User Workflow

1. User opens any normal app route.
2. `RootLayout` renders `LeftSidebar` around the route content.
3. Sidebar reads `usePathname`, route config, app store, and projects context.
4. User can collapse/expand desktop rail, drag-resize it, use back/forward controls, select route links, open search, or start a new chat.
5. Desktop width is clamped between `188` and `320`, default `224`, then persisted through Zustand/localStorage.
6. Mobile uses a top app bar and slide-in drawer; `Escape` closes the drawer.
7. `Cmd/Ctrl+K` toggles session search.
8. Active sessions update when `local-studio.agent.activeSessions` fires.

Loading: project rows may be absent until `ProjectsProvider` loads. Empty: no chat project means the new-chat shortcut is hidden. Error: sidebar itself does not show project API errors; project section owns that. Final UI: selected route is highlighted and content remains full height beside the rail.

## UI/UX Parity Notes

- Desktop: sticky left rail, border-right, `bg-(--sidebar-bg)`, compact `h-10` header.
- Collapsed desktop: only a fixed `PanelLeftOpen` icon button at top-left.
- Route rows: `h-8`, icon left, label right, muted normal text, rounded-md hover.
- Section label: small muted "Workspace" label above route links.
- Settings link is pinned at the bottom.
- Mobile: header bar with hamburger, drawer overlay, close icon, same route list.
- Resize separator is a narrow right-edge hit target with `col-resize`.
- Do not include unrelated providers in demo slices unless project/session nav is being demonstrated.

## ASCII Mockup

```txt
desktop
+----------------------+----------------------------------+
| [collapse][<][>]     | route content                     |
| New chat             |                                  |
| Search               |                                  |
| Workspace            |                                  |
| > Status             |                                  |
|   Usage              |                                  |
|   Models             |                                  |
|   Plugins            |                                  |
|   Server             |                                  |
| Projects...          |                                  |
|----------------------|                                  |
| Settings             |                                  |
+----------------------+----------------------------------+

mobile
+----------------------------------+
| [menu] Local Studio              |
+----------------------------------+
| route content                    |
|                                  |
| drawer: Navigation, routes, ...  |
+----------------------------------+
```

## Proposed Folder Structure

```txt
features/navigation-sidebar/
  components/
    navigation-sidebar-demo.tsx
  hooks/
    use-navigation-sidebar.ts
  api/
    index.ts
  types/
    index.ts
  fixtures/
    index.ts
  constants/
    index.ts
  index.ts
```

## Components

- `NavigationSidebarDemo`: demo shell with desktop rail, mobile drawer, active route state, and mock content slot.
- `NavigationRail`: renders header controls, route rows, search, projects, settings.
- `MobileNavigationDrawer`: slide-in drawer and overlay.
- `NavItem`: route row with active/hover states.
- `SidebarResizeHandle`: updates clamped width.

Props should include `items`, `activePath`, `children`, `projects`, `sessions`, and callbacks for search/new-chat. Keep state local except persisted width/open values.

## API Contracts

Reference endpoints used by adjacent sidebar/project features:

| Endpoint | Method | Source | Request | Response | Error/Auth |
| --- | --- | --- | --- | --- | --- |
| `/api/agent/projects` | GET | `features/agent/projects/api.ts` | none | `{ projects: Project[] }` | JSON `{ error }`; local app route |
| `/api/agent/projects` | POST | `features/agent/projects/api.ts` | project action payload | updated project payload | JSON `{ error }` |
| `/api/agent/sessions/all?since=30d` | GET | `features/agent/ui/sessions-command.tsx` | query string | session summaries | JSON `{ error }` |

Sidebar route links are local Next.js navigation and do not call APIs directly. Auth is not enforced by hidden links.

## State Model

- Local React: mobile drawer open, search open, resize-in-progress, active sessions snapshot.
- Zustand persisted: `desktopSidebarPinnedOpen`, `sidebarWidth`.
- Router state: `usePathname`, `useRouter`.
- Context state: projects from `ProjectsProvider`.
- Browser events: `Escape`, `Cmd/Ctrl+K`, `local-studio.agent.activeSessions`.

## Types / Schemas

```ts
export interface NavItemDef {
  href: string;
  label: string;
  icon: string;
}

export interface SidebarPrefs {
  desktopSidebarPinnedOpen: boolean;
  sidebarWidth: number;
}

export interface ActiveSessionDetail {
  projectId: string;
  cwd: string;
  paneId: string;
  tabId: string;
  piSessionId: string | null;
  title: string;
  status: string;
  focused?: boolean;
  updatedAt: string;
}
```

## Implementation Steps

1. Copy the route item list and active-route logic from `left-sidebar.tsx`.
2. Implement a minimal persisted sidebar hook for width/open.
3. Render desktop rail and mobile drawer from the same item definitions.
4. Add keyboard handling for `Escape` and `Cmd/Ctrl+K`.
5. Add project/session fixture rows only when the demo needs them.
6. Verify collapse, resize, route selection, mobile drawer, and search affordance states.

## Copy / Modify Map

- Copy concepts from `features/shell/left-sidebar.tsx`: route list, clamp values, active route rules, desktop/mobile split.
- Reuse primitives from `ui/page.tsx`, `ui/button.tsx`, `ui/search-input.tsx`, and token classes.
- Modify out project provider dependency for demos unless testing project navigation.
- Do not copy `Providers` wholesale.

## Acceptance Criteria

- Desktop rail width, collapsed state, active rows, mobile drawer, and bottom settings link match reference behavior.
- `Cmd/Ctrl+K` toggles session search affordance.
- Sidebar state survives reload in the demo.
- Content area remains full height and scroll behavior is not broken.
- Keyboard buttons have accessible labels.

## Anti-Overengineering Notes

Keep one static nav config and one tiny preference hook. Do not build route registries, permission engines, auth wrappers, or a plugin nav system. Hidden links are not authorization.
