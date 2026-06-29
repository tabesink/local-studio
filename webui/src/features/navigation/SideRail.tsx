"use client";

import Link from "next/link";
import { Activity, Files, MessageSquare, Network, Settings } from "lucide-react";
import type { RefObject } from "react";

import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cx } from "@/components/shared/cx";
import type { CurrentUser } from "@/features/auth/session";
import { filterNavigationItems, isRouteActive, type NavigationIcon } from "@/features/navigation/navigation";

const iconMap = {
  MessageSquare,
  Files,
  Network,
  Activity,
} satisfies Record<NavigationIcon, typeof MessageSquare>;

export function SideRail({
  currentUser,
  pathname,
  onOpenSettings,
  settingsButtonRef,
  settingsOpen,
}: {
  currentUser: CurrentUser;
  pathname: string;
  onOpenSettings: () => void;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
  settingsOpen: boolean;
}) {
  const items = filterNavigationItems(currentUser.role);

  return (
    <aside
      data-testid="side-rail"
      className="flex h-full w-[var(--shell-rail-compact)] shrink-0 flex-col items-center overflow-hidden border-r border-[var(--ui-border)] bg-[var(--ui-rail)] py-3"
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-[var(--rad-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[length:var(--fs-sm)] font-[var(--weight-medium)] leading-[var(--leading-tight)]"
        aria-label="Context Engine"
        title={`Context Engine: ${currentUser.role}`}
      >
        CE
      </div>

      <div className="my-3 h-px w-7 bg-[var(--ui-border)]" />

      <nav aria-label="Primary navigation" className="flex flex-col items-center gap-1.5">
        {items.map((item) => {
          const active = isRouteActive(pathname, item.href);
          const Icon = iconMap[item.icon];
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cx(
                "relative inline-flex h-8 w-8 items-center justify-center rounded-[var(--rad-md)] text-[var(--ui-fg-muted)] transition-colors",
                "hover:bg-[var(--ui-hover)] hover:text-[var(--ui-fg)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-accent)]",
                active && "bg-[var(--ui-selected)] text-[var(--ui-fg)]",
              )}
            >
              {active ? (
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-[var(--rad-full)] bg-[var(--ui-accent)]"
                />
              ) : null}
              <Icon aria-hidden size={15} strokeWidth={1.75} className={active ? "opacity-95" : "opacity-70"} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-1.5 border-t border-[var(--ui-border)] pt-2">
        <ThemeToggle />
        <button
          ref={settingsButtonRef}
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
          aria-expanded={settingsOpen}
          className={cx(
            "relative inline-flex h-8 w-8 items-center justify-center rounded-[var(--rad-md)] text-[var(--ui-fg-muted)] transition-colors",
            "hover:bg-[var(--ui-hover)] hover:text-[var(--ui-fg)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-accent)]",
            settingsOpen && "bg-[var(--ui-selected)] text-[var(--ui-fg)]",
          )}
        >
          {settingsOpen ? (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-[var(--rad-full)] bg-[var(--ui-accent)]"
            />
          ) : null}
          <Settings aria-hidden size={15} strokeWidth={1.75} className={settingsOpen ? "opacity-95" : "opacity-70"} />
        </button>
      </div>
    </aside>
  );
}
