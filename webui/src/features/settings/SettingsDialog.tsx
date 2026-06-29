"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useMemo } from "react";

import type { CurrentUser } from "@/features/auth/session";
import {
  filterSettingsSections,
  settingsSections,
  type SettingsSectionId,
} from "@/features/navigation/navigation";
import { cx } from "@/components/shared/cx";

export function SettingsDialog({
  currentUser,
  open,
  activeSection,
  onOpenChange,
  onSectionChange,
  onClosedAutoFocus,
}: {
  currentUser: CurrentUser;
  open: boolean;
  activeSection: SettingsSectionId;
  onOpenChange: (open: boolean) => void;
  onSectionChange: (section: SettingsSectionId) => void;
  onClosedAutoFocus?: () => void;
}) {
  const sections = useMemo(() => filterSettingsSections(currentUser.role), [currentUser.role]);
  const active = sections.find((section) => section.id === activeSection) ?? sections[0];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" />
        <Dialog.Content
          aria-describedby="settings-description"
          onCloseAutoFocus={(event) => {
            if (!onClosedAutoFocus) return;
            event.preventDefault();
            onClosedAutoFocus();
          }}
          className="fixed left-1/2 top-1/2 z-50 grid h-[min(620px,calc(100dvh-32px))] w-[min(760px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 grid-cols-1 overflow-hidden rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--ui-popover)] text-[var(--ui-fg)] shadow-[0_24px_80px_rgba(0,0,0,0.42)] outline-none sm:grid-cols-[220px_minmax(0,1fr)]"
        >
          <aside className="min-h-0 border-b border-[var(--ui-border)] bg-[var(--ui-panel)] p-2 sm:border-b-0 sm:border-r">
            <div className="flex h-8 items-center justify-between gap-2 px-2">
              <Dialog.Title className="m-0 truncate text-[length:var(--fs-xl)] font-[var(--weight-medium)] leading-[var(--leading-tight)]">
                Settings
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--rad-lg)] text-[var(--ui-fg-muted)] hover:bg-[var(--ui-hover)] hover:text-[var(--ui-fg)]"
                  aria-label="Close settings"
                  title="Close settings"
                >
                  <X aria-hidden size={14} />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description
              id="settings-description"
              className="mt-1 px-2 text-[length:var(--fs-sm)] leading-[var(--leading)] text-[var(--ui-fg-muted)]"
            >
              Manage workbench preferences and administrative areas available to your role.
            </Dialog.Description>
            <nav aria-label="Settings sections" className="mt-3 flex flex-col gap-1">
              {sections.map((section) => {
                const selected = section.id === active?.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    aria-current={selected ? "page" : undefined}
                    onClick={() => onSectionChange(section.id)}
                    className={cx(
                      "relative grid h-8 grid-cols-[minmax(0,1fr)] items-center rounded-[var(--rad-md)] px-2 text-left text-[length:var(--fs-md)] transition-colors",
                      selected
                        ? "bg-[var(--ui-selected)] text-[var(--ui-fg)]"
                        : "text-[var(--ui-fg-muted)] hover:bg-[var(--ui-hover)] hover:text-[var(--ui-fg)]",
                    )}
                  >
                    {selected ? (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-[var(--rad-full)] bg-[var(--ui-accent)]"
                      />
                    ) : null}
                    <span className={cx("truncate", selected ? "font-[var(--weight-medium)]" : "")}>{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-h-0 overflow-y-auto px-4 py-4">
            <p className="m-0 font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">
              {currentUser.role === "admin" ? "ADMIN" : "MEMBER"}
            </p>
            <h2 className="m-0 mt-1 text-[length:var(--fs-2xl)] font-[var(--weight-medium)] leading-[var(--leading-tight)]">
              {active?.label ?? "Settings"}
            </h2>
            <p className="mt-2 text-[length:var(--fs-md)] leading-[var(--leading)] text-[var(--ui-fg-muted)]">
              {active?.description ?? "Settings sections will appear here when available."}
            </p>

            <div className="mt-4 divide-y divide-[var(--ui-border)] rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-panel)]">
              <div className="grid min-h-[var(--row-h)] grid-cols-[120px_1fr] items-center gap-3 px-3 py-2">
                <span className="font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">Signed in</span>
                <span className="truncate text-[length:var(--fs-md)] text-[var(--ui-fg)]">
                  {currentUser.displayName ?? currentUser.email}
                </span>
              </div>
              <div className="grid min-h-[var(--row-h)] grid-cols-[120px_1fr] items-center gap-3 px-3 py-2">
                <span className="font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">Status</span>
                <span className="text-[length:var(--fs-md)] text-[var(--ui-fg-muted)]">
                  {currentUser.isActive ? "Active session fixture" : "Inactive user"}
                </span>
              </div>
              <div className="px-3 py-2 text-[length:var(--fs-md)] leading-[var(--leading)] text-[var(--ui-fg-muted)]">
                No settings values are available in this section yet.
              </div>
            </div>

            {currentUser.role === "member" ? (
              <p className="mt-3 rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-[length:var(--fs-sm)] text-[var(--ui-fg-muted)]">
                Administrative sections are hidden for members.
              </p>
            ) : null}
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function getDefaultSettingsSectionForRole(role: CurrentUser["role"]): SettingsSectionId {
  return filterSettingsSections(role)[0]?.id ?? settingsSections[0].id;
}
