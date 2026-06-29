"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { ForbiddenState } from "@/components/shared/ForbiddenState";
import { fetchCurrentUser, formatSessionError, isUnauthenticatedError, type CurrentUser } from "@/features/auth/session";
import { isAdminOnlyPath } from "@/features/navigation/navigation";
import { SideRail } from "@/features/navigation/SideRail";
import { SettingsDialog, getDefaultSettingsSectionForRole } from "@/features/settings/SettingsDialog";
import { useSettingsDialogState } from "@/features/settings/settings-dialog-state";

const initialSession = { status: "loading" as const, user: null, error: null };

type SessionState =
  | typeof initialSession
  | { status: "authenticated"; user: CurrentUser; error: null }
  | { status: "unauthenticated"; user: null; error: null }
  | { status: "error"; user: null; error: string };

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<SessionState>(initialSession);
  const settings = useSettingsDialogState();
  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const settingsReturnFocusRef = useRef<HTMLButtonElement | null>(null);

  const setSettingsSection = settings.setSection;

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((user) => {
        if (cancelled) return;
        setSession({ status: "authenticated", user, error: null });
        setSettingsSection(getDefaultSettingsSectionForRole(user.role));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isUnauthenticatedError(error)) {
          setSession({ status: "unauthenticated", user: null, error: null });
          window.location.assign("/login");
          return;
        }
        setSession({ status: "error", user: null, error: formatSessionError(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [setSettingsSection]);

  if (session.status === "loading") {
    return <ShellFrame placeholder="Resolving session" />;
  }

  if (session.status === "unauthenticated") {
    return <ShellFrame placeholder="Sign in is required before the app shell can load." />;
  }

  if (session.status === "error") {
    return <ShellFrame placeholder={session.error} tone="error" />;
  }

  const forbidden = session.user.role !== "admin" && isAdminOnlyPath(pathname);

  return (
    <section
      data-testid="app-shell"
      className="flex min-h-[100dvh] bg-[var(--ui-bg)] p-3 text-[var(--ui-fg)] sm:p-4 lg:p-5"
    >
      <div
        data-testid="app-workframe"
        className="relative flex h-[calc(100dvh-1.5rem)] min-h-[520px] w-full overflow-hidden rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--ui-bg)] sm:h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-2.5rem)]"
      >
        <SideRail
          currentUser={session.user}
          pathname={pathname}
          onOpenSettings={() => {
            settingsReturnFocusRef.current = settingsButtonRef.current;
            settings.openSettings(getDefaultSettingsSectionForRole(session.user.role));
          }}
          settingsButtonRef={settingsButtonRef}
          settingsOpen={settings.open}
        />
        <main data-testid="app-work-canvas" className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[var(--ui-bg)]">
          {forbidden ? <ForbiddenState /> : children}
        </main>
      </div>
      <SettingsDialog
        currentUser={session.user}
        open={settings.open}
        activeSection={settings.section}
        onOpenChange={settings.setOpen}
        onSectionChange={settings.setSection}
        onClosedAutoFocus={() => settingsReturnFocusRef.current?.focus()}
      />
    </section>
  );
}

function ShellFrame({ placeholder, tone = "default" }: { placeholder: string; tone?: "default" | "error" }) {
  return (
    <section className="flex min-h-[100dvh] bg-[var(--ui-bg)] p-3 text-[var(--ui-fg)] sm:p-4 lg:p-5">
      <div className="relative flex h-[calc(100dvh-1.5rem)] min-h-[520px] w-full overflow-hidden rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--ui-bg)] sm:h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-2.5rem)]">
        <aside className="h-full w-[var(--shell-rail-compact)] shrink-0 border-r border-[var(--ui-border)] bg-[var(--ui-rail)]" />
        <main className="flex min-w-0 flex-1 items-center justify-center px-4">
          <div className="rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--ui-panel)] px-4 py-3">
            <p className="m-0 font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">SESSION</p>
            <p className={tone === "error" ? "mt-1 text-[length:var(--fs-md)] text-[var(--ui-err)]" : "mt-1 text-[length:var(--fs-md)] text-[var(--ui-fg-muted)]"}>
              {placeholder}
            </p>
          </div>
        </main>
      </div>
    </section>
  );
}
