"use client";

import type { ReactNode } from "react";
import {
  Gauge,
  Globe,
  HardDrive,
  Microchip,
  Plug,
  Search,
  Settings,
  SquarePen,
} from "lucide-react";
import { featureNavItems } from "../fixtures";
import { cx } from "../ui";

const navIcons: Record<string, typeof Gauge> = {
  gauge: Gauge,
  microchip: Microchip,
  "hard-drive": HardDrive,
  plug: Plug,
  globe: Globe,
  settings: Settings,
};

/* Minimal Local Studio rail — mirrors the geometry and row grammar of
   .references/local-studio/frontend/src/features/shell/left-sidebar.tsx.
   The full-behavior version (resize, collapse, mobile drawer, Cmd+K)
   lives in features/navigation-sidebar. */
export function DemoShell({
  activePath = "/",
  children,
  sidebar = true,
}: {
  activePath?: string;
  children: ReactNode;
  sidebar?: boolean;
}) {
  if (!sidebar) return <div className="h-full min-h-0 bg-(--ui-bg) text-(--ui-fg)">{children}</div>;

  const routeItems = featureNavItems.filter((item) => item.href !== "/settings");
  const settingsItem = featureNavItems.find((item) => item.href === "/settings");

  return (
    <div className="flex h-full min-h-0 bg-(--ui-bg) text-(--ui-fg)">
      <aside
        className="hidden shrink-0 border-r border-(--border) bg-(--sidebar-bg) shadow-[inset_-1px_0_rgba(255,255,255,0.02)] md:flex md:flex-col"
        style={{ width: "var(--sidebar-w)" }}
      >
        <div className="flex h-10 shrink-0 items-center gap-1 border-b border-(--border)/35 px-1.5 text-[length:var(--fs-sm)] text-(--dim)">
          <span className="px-1.5">Local Studio</span>
        </div>
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
            className="mb-1 flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-(--color-foreground-subtle) transition-colors hover:bg-(--color-surface-hover) hover:text-(--fg)"
            title="Search sessions"
          >
            <Search className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} />
            <span className="flex-1 truncate text-left text-[length:var(--fs-lg)] font-normal">
              Search
            </span>
          </button>

          <div className="mb-1 mt-4 px-2.5 text-[length:var(--fs-sm)] font-normal text-(--color-foreground-subtlest)">
            Workspace
          </div>
          {routeItems.map((item) => {
            const active = item.href === "/" ? activePath === "/" : activePath.startsWith(item.href);
            const Icon = navIcons[item.icon] ?? Gauge;
            return (
              <a
                key={item.href}
                href={item.href}
                title={item.label}
                className={cx(
                  "group relative flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2.5 transition-colors",
                  active
                    ? "bg-(--color-surface-hover) font-medium text-(--fg)"
                    : "text-(--color-foreground-subtle) hover:bg-(--color-surface-hover) hover:text-(--fg)",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-(--fg)/50"
                  />
                ) : null}
                <Icon
                  className={cx("h-4 w-4 shrink-0", active ? "text-(--fg)/85" : "opacity-60")}
                  strokeWidth={1.75}
                />
                <span className="whitespace-nowrap text-[length:var(--fs-lg)]">{item.label}</span>
              </a>
            );
          })}
        </nav>
        {settingsItem ? (
          <div className="shrink-0 px-2 py-2">
            <a
              href={settingsItem.href}
              title="Settings"
              className={cx(
                "group relative flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2.5 transition-colors",
                activePath.startsWith("/settings")
                  ? "bg-(--color-surface-hover) font-medium text-(--fg)"
                  : "text-(--color-foreground-subtle) hover:bg-(--color-surface-hover) hover:text-(--fg)",
              )}
            >
              {activePath.startsWith("/settings") ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-(--fg)/50"
                />
              ) : null}
              <Settings
                className={cx(
                  "h-4 w-4 shrink-0",
                  activePath.startsWith("/settings") ? "text-(--fg)/85" : "opacity-60",
                )}
                strokeWidth={1.75}
              />
              <span className="whitespace-nowrap text-[length:var(--fs-lg)] font-normal">
                Settings
              </span>
            </a>
          </div>
        ) : null}
      </aside>
      <div className="min-w-0 flex-1 bg-(--agent-bg)">{children}</div>
    </div>
  );
}
