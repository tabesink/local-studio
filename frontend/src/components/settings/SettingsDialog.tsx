"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { readUiPreference, writeUiPreference } from "@/lib/storage";
import {
  closeSettingsDialog,
  setSettingsDialogRoute,
  useSettingsDialogStore,
  type SettingsRoute,
} from "@/state/settings-dialog-store";
import { useAuthStore } from "@/state/auth-store";

const ROUTES: Array<{ id: SettingsRoute; label: string }> = [
  { id: "personal", label: "Personal" },
  { id: "administration", label: "Administration" },
];

export function SettingsDialog() {
  const isOpen = useSettingsDialogStore((state) => state.isOpen);
  const route = useSettingsDialogStore((state) => state.route);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "administrator";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4" role="presentation">
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="settings-title"
        className="grid h-[min(620px,calc(100vh-48px))] w-[min(880px,calc(100vw-32px))] grid-cols-[180px_1fr] overflow-hidden rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--color-popover)]"
      >
        <aside className="border-r border-[var(--ui-border)] bg-[var(--color-panel)] p-3">
          <Button variant="icon" aria-label="Close settings" onClick={closeSettingsDialog}>
            <X className="size-4" aria-hidden />
          </Button>
          <nav className="mt-4 space-y-1" aria-label="Settings sections">
            {ROUTES.map((item) => {
              const active = route === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSettingsDialogRoute(item.id)}
                  className={`flex h-7 w-full items-center rounded-[var(--rad-md)] px-2 text-left text-[length:var(--fs-md)] ${
                    active ? "bg-[var(--ui-active)] text-[var(--fg)]" : "text-[var(--dim)] hover:bg-[var(--ui-hover)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 overflow-y-auto p-5">
          <header className="mb-4 border-b border-[var(--ui-border)] pb-3">
            <h2 id="settings-title" className="text-[length:var(--fs-xl)] font-semibold">
              Settings
            </h2>
          </header>
          {route === "personal" ? <PersonalSettings /> : null}
          {route === "administration" ? <AdministrationSettings isAdmin={isAdmin} /> : null}
        </div>
      </section>
    </div>
  );
}

function PersonalSettings() {
  const theme = readUiPreference("ce.theme") ?? "zai-dark";
  const density = readUiPreference("ce.density") ?? "compact";

  return (
    <div className="space-y-4">
      <SettingRow label="Theme">
        <SegmentedControl
          value={theme}
          items={[
            { id: "zai-dark", label: "Dark" },
            { id: "zai-light", label: "Light" },
          ]}
          onChange={(value) => {
            writeUiPreference("ce.theme", value);
            document.documentElement.dataset.theme = value;
          }}
        />
      </SettingRow>
      <SettingRow label="Density">
        <SegmentedControl
          value={density}
          items={[
            { id: "compact", label: "Compact" },
            { id: "comfortable", label: "Comfortable" },
          ]}
          onChange={(value) => writeUiPreference("ce.density", value)}
        />
      </SettingRow>
    </div>
  );
}

function AdministrationSettings({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="space-y-3">
      <SettingRow label="Access">
        <span className="text-[length:var(--fs-sm)] text-[var(--dim)]">
          {isAdmin ? "Administrator" : "Member"}
        </span>
      </SettingRow>
      <SettingRow label="Panels">
        <span className="text-[length:var(--fs-sm)] text-[var(--dim)]">
          Administration panels are unavailable.
        </span>
      </SettingRow>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-9 grid-cols-[160px_1fr] items-center gap-3 border-b border-[var(--ui-border)] py-2">
      <div className="text-[length:var(--fs-sm)] text-[var(--dim)]">{label}</div>
      <div>{children}</div>
    </div>
  );
}
