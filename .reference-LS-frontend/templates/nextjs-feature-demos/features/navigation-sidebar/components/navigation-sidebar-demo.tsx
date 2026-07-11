"use client";

import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Globe,
  HardDrive,
  Menu,
  Microchip,
  PanelLeftOpen,
  Plug,
  Search,
  Settings,
  Square,
  SquarePen,
  X,
} from "lucide-react";
import { cx, IconButton, SearchInput, StatusPill } from "../../../_shared/ui";
import { useNavigationSidebar } from "../hooks/use-navigation-sidebar";

const navIcons: Record<string, typeof Gauge> = {
  gauge: Gauge,
  microchip: Microchip,
  "hard-drive": HardDrive,
  plug: Plug,
  globe: Globe,
};

/* Local Studio left rail — mirrors features/shell/left-sidebar.tsx: desktop
   resizable rail with collapse, Cmd/Ctrl+K session search, mobile top app bar
   with a right slide-in drawer. */
export function NavigationSidebarDemo({ children }: { children?: ReactNode }) {
  const sidebar = useNavigationSidebar("/");

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-(--ui-bg) text-(--ui-fg)">
      {!sidebar.expanded ? (
        <div className="fixed left-0 top-0 z-50 hidden h-9 w-10 items-center justify-center md:flex">
          <IconButton
            onClick={() => sidebar.setExpanded(true)}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="text-(--dim)/70"
          >
            <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
          </IconButton>
        </div>
      ) : null}

      <aside
        className={cx(
          "relative z-40 hidden h-full shrink-0 flex-col overflow-hidden border-r border-(--border) bg-(--sidebar-bg) shadow-[inset_-1px_0_rgba(255,255,255,0.02)] md:flex",
          sidebar.resizing ? "" : "transition-[width] duration-150 ease-out",
          sidebar.expanded ? "" : "w-0 border-r-0",
        )}
        style={{ width: sidebar.expanded ? `${sidebar.width}px` : 0 }}
        aria-hidden={!sidebar.expanded}
      >
        {sidebar.expanded ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            title="Resize sidebar"
            onMouseDown={sidebar.startResize}
            className={cx(
              "absolute right-0 top-0 z-[60] h-full w-2 cursor-col-resize transition-colors",
              sidebar.resizing ? "bg-(--fg)/10" : "hover:bg-(--fg)/8",
            )}
          />
        ) : null}
        <div
          className={cx(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            sidebar.expanded ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {sidebar.expanded ? (
            <>
              {/* Header — panel toggle + back/forward arrows grouped left. */}
              <div className="sticky top-0 z-50 flex h-10 shrink-0 items-center gap-1 border-b border-(--border)/35 bg-(--sidebar-bg) px-1.5">
                <IconButton
                  onClick={() => sidebar.setExpanded(false)}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <Square className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton title="Go back" aria-label="Go back">
                  <ChevronLeft className="h-4 w-4" />
                </IconButton>
                <IconButton title="Go forward" aria-label="Go forward">
                  <ChevronRight className="h-4 w-4" />
                </IconButton>
              </div>

              {/* Primary nav — 14px rows with quiet icons, rounded-md hover,
                  normal-case muted section labels. */}
              <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-2 py-0.5">
                <button
                  type="button"
                  className="mb-0.5 flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-(--color-foreground-subtle) transition-colors hover:bg-(--color-surface-hover) hover:text-(--fg)"
                  title="New chat"
                >
                  <SquarePen className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} />
                  <span className="flex-1 truncate text-left text-[length:var(--fs-lg)] font-normal">
                    New chat
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => sidebar.setSearchOpen(true)}
                  className="mb-1 flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-(--color-foreground-subtle) transition-colors hover:bg-(--color-surface-hover) hover:text-(--fg)"
                  title="Search sessions (⌘K)"
                >
                  <Search className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} />
                  <span className="flex-1 truncate text-left text-[length:var(--fs-lg)] font-normal">
                    Search
                  </span>
                </button>

                <div className="mb-1 mt-4 px-2.5 text-[length:var(--fs-sm)] font-normal text-(--color-foreground-subtlest)">
                  Workspace
                </div>
                {sidebar.items.map((item) => (
                  <NavItemDesktop
                    key={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={item.active}
                    onClick={() => sidebar.activatePath(item.href)}
                  />
                ))}

                <div className="mb-1 mt-4 px-2.5 text-[length:var(--fs-sm)] font-normal text-(--color-foreground-subtlest)">
                  Projects
                </div>
                {sidebar.projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-md px-2.5 py-1.5 text-[length:var(--fs-sm)] text-(--color-foreground-subtle) transition-colors hover:bg-(--color-surface-hover)"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[length:var(--fs-md)] text-(--fg)">
                        {project.name}
                      </span>
                      {project.activeSessions ? (
                        <StatusPill tone="good">{project.activeSessions}</StatusPill>
                      ) : null}
                    </div>
                    <div className="truncate font-mono text-[length:var(--fs-xs)]">{project.path}</div>
                  </div>
                ))}
              </nav>

              {/* Settings pinned at the bottom. */}
              <div className="shrink-0 px-2 py-2">
                <button
                  type="button"
                  onClick={() => sidebar.activatePath("/settings")}
                  title="Settings"
                  className={cx(
                    "group relative flex h-8 w-full shrink-0 items-center gap-2.5 rounded-md px-2.5 transition-colors",
                    sidebar.isRouteActive(sidebar.activePath, "/settings")
                      ? "bg-(--color-surface-hover) font-medium text-(--fg)"
                      : "text-(--color-foreground-subtle) hover:bg-(--color-surface-hover) hover:text-(--fg)",
                  )}
                >
                  {sidebar.isRouteActive(sidebar.activePath, "/settings") ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-(--fg)/50"
                    />
                  ) : null}
                  <Settings
                    className={cx(
                      "h-4 w-4 shrink-0",
                      sidebar.isRouteActive(sidebar.activePath, "/settings")
                        ? "text-(--fg)/85"
                        : "opacity-60",
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="whitespace-nowrap text-[length:var(--fs-lg)] font-normal">
                    Settings
                  </span>
                </button>
              </div>
            </>
          ) : null}
        </div>
      </aside>

      {/* Mobile: top app bar + hamburger drawer (no footer nav). */}
      <div className="fixed left-0 right-0 top-0 z-40 flex h-11 items-center justify-between border-b border-(--border)/70 bg-(--bg) px-4 md:hidden">
        <span className="truncate text-[length:var(--fs-base)] font-semibold tracking-tight text-(--fg)">
          Status
        </span>
        <button
          type="button"
          onClick={() => sidebar.setMobileOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-(--dim) transition-colors hover:bg-(--surface) hover:text-(--fg)"
          aria-label="Open navigation menu"
          aria-expanded={sidebar.mobileOpen}
          aria-controls="mobile-navigation-drawer"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
      </div>

      {sidebar.mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/60"
            aria-label="Close navigation menu"
            onClick={() => sidebar.setMobileOpen(false)}
          />
          <aside
            id="mobile-navigation-drawer"
            className="absolute right-0 top-0 flex h-full w-[min(22rem,88vw)] flex-col border-l border-(--border) bg-(--bg)"
          >
            <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-(--border) px-4">
              <div className="truncate text-sm font-semibold text-(--fg)">Navigation</div>
              <button
                type="button"
                onClick={() => sidebar.setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center text-(--dim) hover:text-(--fg)"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
              <div className="mb-2 px-2 text-[length:var(--fs-xs)] font-semibold uppercase tracking-[0.18em] text-(--dim)">
                Navigation
              </div>
              {sidebar.items.map((item) => (
                <NavItemMobile
                  key={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={item.active}
                  onClick={() => {
                    sidebar.activatePath(item.href);
                    sidebar.setMobileOpen(false);
                  }}
                />
              ))}
              <NavItemMobile
                label="Settings"
                icon="settings"
                active={sidebar.isRouteActive(sidebar.activePath, "/settings")}
                onClick={() => {
                  sidebar.activatePath("/settings");
                  sidebar.setMobileOpen(false);
                }}
              />
            </nav>
          </aside>
        </div>
      ) : null}

      {/* Sessions command overlay (⌘K). */}
      {sidebar.searchOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 pt-24"
          onClick={() => sidebar.setSearchOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border border-(--border) bg-(--color-popover) p-3 shadow-[var(--composer-shadow)]"
            onClick={(event) => event.stopPropagation()}
          >
            <SearchInput value="" onChange={() => undefined} placeholder="Search sessions..." />
            <div className="mt-3 space-y-1">
              {sidebar.activeSessions.map((session) => (
                <div
                  key={session.tabId}
                  className="rounded-md px-2 py-1.5 text-[length:var(--fs-sm)] transition-colors hover:bg-(--hover)"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-(--fg)">{session.title}</span>
                    <StatusPill tone={session.status === "running" ? "info" : "default"}>
                      {session.status}
                    </StatusPill>
                  </div>
                  <div className="truncate font-mono text-[length:var(--fs-xs)] text-(--dim)">
                    {session.cwd}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Main content */}
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-(--agent-bg) pt-11 md:pt-0">
        {children ?? (
          <div className="p-6 text-[length:var(--fs-base)] text-(--dim)">
            Route content renders here. Select a workspace item, resize the rail, collapse it, or
            press <span className="font-mono">⌘K</span> to search sessions.
          </div>
        )}
      </main>
    </div>
  );
}

function NavItemDesktop({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = navIcons[icon] ?? Gauge;
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cx(
        "group relative flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-left transition-colors",
        active
          ? "bg-(--color-surface-hover) font-medium text-(--fg)"
          : "text-(--color-foreground-subtle) hover:bg-(--color-surface-hover) hover:text-(--fg)",
      )}
    >
      {/* Quiet left-edge hairline marks the active route. */}
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-(--fg)/50"
        />
      ) : null}
      <Icon className={cx("h-4 w-4 shrink-0", active ? "text-(--fg)/85" : "opacity-60")} strokeWidth={1.75} />
      <span className="whitespace-nowrap text-[length:var(--fs-lg)]">{label}</span>
    </button>
  );
}

function NavItemMobile({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = icon === "settings" ? Settings : (navIcons[icon] ?? Gauge);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "mb-1 flex h-12 w-full items-center gap-3 border-l-2 px-2 text-left text-sm font-medium transition-colors",
        active
          ? "border-(--accent) text-(--fg)"
          : "border-transparent text-(--dim) hover:text-(--fg)",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
