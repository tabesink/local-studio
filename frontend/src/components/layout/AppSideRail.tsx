"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LogOut, MessageSquare, Network, Settings } from "lucide-react";
import { cx } from "@/lib/cx";
import { openSettingsDialog, useSettingsDialogStore } from "@/state/settings-dialog-store";
import { useAuthStore } from "@/state/auth-store";

function railItemClass(active = false) {
  return cx(
    "inline-flex size-9 items-center justify-center rounded-[var(--rad-lg)] text-[var(--dim)] transition-colors",
    "hover:bg-[var(--ui-hover)] hover:text-[var(--fg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]",
    active && "bg-[var(--ui-active)] text-[var(--fg)]",
  );
}

export function AppSideRail() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const settingsOpen = useSettingsDialogStore((state) => state.isOpen);

  return (
    <aside className="flex h-full w-14 shrink-0 flex-col items-center border-r border-[var(--ui-border)] bg-[var(--rail)] py-3">
      <div
        className="flex size-9 items-center justify-center rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--color-panel)] font-mono text-[length:var(--fs-sm)] font-semibold"
        aria-label="Context Engine"
      >
        CE
      </div>
      <div className="my-3 h-px w-7 bg-[var(--ui-border)]" />

      <nav className="flex flex-col items-center gap-2" aria-label="Application">
        <Link href="/chat" aria-label="Chat" title="Chat" className={railItemClass(pathname.startsWith("/chat"))}>
          <MessageSquare className="size-4" aria-hidden />
        </Link>
        <Link
          href="/documents"
          aria-label="Documents"
          title="Documents"
          className={railItemClass(pathname.startsWith("/documents"))}
        >
          <FileText className="size-4" aria-hidden />
        </Link>
        <Link
          href="/database-visualize"
          aria-label="Knowledge graph"
          title="Knowledge graph"
          className={railItemClass(pathname.startsWith("/database-visualize"))}
        >
          <Network className="size-4" aria-hidden />
        </Link>
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          className={railItemClass(settingsOpen)}
          onClick={() => openSettingsDialog("personal")}
        >
          <Settings className="size-4" aria-hidden />
        </button>
      </nav>

      <button
        type="button"
        aria-label="Logout"
        title="Logout"
        className={cx(railItemClass(), "mt-auto")}
        onClick={() => {
          // logout() always clears auth state and redirects in its own finally
          // block; this catch only prevents an unhandled rejection if the API
          // call itself fails (e.g. network error).
          logout().catch(() => undefined);
        }}
      >
        <LogOut className="size-4" aria-hidden />
      </button>
    </aside>
  );
}
