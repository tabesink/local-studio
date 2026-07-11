"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import {
  cx,
  SegmentedControl,
  Select,
  SettingsButton,
  SettingsGroup,
  SettingsRow,
  SettingsValue,
  StatusPill,
} from "../../../_shared/ui";
import { useUserPreferences } from "../hooks/use-user-preferences";
import type { ThemeMeta, ThemeMode, ThemeTokens } from "../types";

/* User preferences — mirrors features/settings/appearance-settings.tsx:
   Light/Dark/System segmented control, theme rows with tiny bordered
   swatches, compact token color editor, font + density sliders. All local;
   persisted to localStorage and applied live to document variables. */
export function UserPreferencesDemo() {
  const prefs = useUserPreferences();

  return (
    <main className="min-h-full overflow-y-auto bg-(--ui-bg) text-(--ui-fg)">
      <div className="mx-auto w-full max-w-[640px] px-4 py-6">
        <SettingsGroup title="Mode" description="Use light, dark, or match your system.">
          <SettingsRow
            label="Theme mode"
            control={
              <SegmentedControl<ThemeMode>
                items={[
                  { id: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
                  { id: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
                  { id: "system", label: "System", icon: <Monitor className="h-3.5 w-3.5" /> },
                ]}
                value={prefs.preferences.themeMode}
                onChange={prefs.setThemeMode}
                size="sm"
              />
            }
          />
        </SettingsGroup>

        <SettingsGroup title="Theme" description="Local UI preference — no account API exists in the reference.">
          {prefs.themes.map((theme) => (
            <ThemeRow
              key={theme.id}
              theme={theme}
              active={theme.id === prefs.preferences.themeId}
              onSelect={() => prefs.setThemeId(theme.id)}
            />
          ))}
        </SettingsGroup>

        <SettingsGroup
          title="Theme editor"
          description="Compact token overrides applied on top of the selected theme."
          actions={<SettingsButton onClick={prefs.resetTokens}>Reset</SettingsButton>}
        >
          {(Object.entries(prefs.tokens) as Array<[keyof ThemeTokens, string]>).map(([key, value]) => (
            <SettingsRow
              key={key}
              label={key}
              control={
                <div className="flex items-center gap-2">
                  <span
                    className="h-5 w-5 shrink-0 rounded-[var(--rad-xs)] border border-(--ui-border)"
                    style={{ backgroundColor: value }}
                    aria-hidden
                  />
                  <input
                    value={value}
                    onChange={(event) => prefs.patchToken(key, event.target.value)}
                    aria-label={`Token ${key}`}
                    className="h-7 w-28 rounded-md border border-(--ui-separator) bg-(--ui-bg) px-2 font-mono text-[length:var(--fs-sm)] text-(--ui-fg) outline-none focus:border-(--ui-accent)/40"
                  />
                </div>
              }
            />
          ))}
        </SettingsGroup>

        <SettingsGroup title="Typography">
          <SettingsRow
            label="Font family"
            control={
              <Select
                aria-label="Font family"
                value={prefs.preferences.fontFamilyId}
                onChange={(event) => prefs.patchPreference({ fontFamilyId: event.target.value })}
                options={prefs.fontFamilies.map((family) => ({ value: family.id, label: family.label }))}
                className="w-40"
              />
            }
          />
          <SliderRow
            label="UI font size"
            value={prefs.preferences.fontSize}
            display={`${prefs.preferences.fontSize}px`}
            min={13}
            max={20}
            step={1}
            onChange={(fontSize) => prefs.patchPreference({ fontSize })}
          />
        </SettingsGroup>

        <SettingsGroup title="Density">
          <SliderRow
            label="UI scale"
            value={prefs.preferences.uiScale}
            display={prefs.preferences.uiScale.toFixed(2)}
            min={0.85}
            max={1.25}
            step={0.05}
            onChange={(uiScale) => prefs.patchPreference({ uiScale: Number(uiScale.toFixed(2)) })}
          />
          <SliderRow
            label="Radius"
            value={prefs.preferences.radiusBase}
            display={`${prefs.preferences.radiusBase}px`}
            min={0}
            max={14}
            step={1}
            onChange={(radiusBase) => prefs.patchPreference({ radiusBase })}
          />
        </SettingsGroup>
      </div>
    </main>
  );
}

function ThemeRow({
  theme,
  active,
  onSelect,
}: {
  theme: ThemeMeta;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cx(
        "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
        active ? "bg-(--ui-active)" : "hover:bg-(--ui-hover)/35",
      )}
    >
      {/* Tiny bordered swatch strip: bg / surface / accent / fg. */}
      <span className="flex shrink-0 overflow-hidden rounded-[var(--rad-xs)] border border-(--ui-border)">
        {theme.swatches.map((swatch, index) => (
          <span key={index} className="h-5 w-3.5" style={{ backgroundColor: swatch }} aria-hidden />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[length:var(--fs-base)] font-medium text-(--ui-fg)">
            {theme.name}
          </span>
          <span className="font-mono text-[length:var(--fs-2xs)] uppercase tracking-[0.14em] text-(--ui-muted)/70">
            {theme.group}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-[length:var(--fs-sm)] text-(--ui-muted)">
          {theme.description}
        </span>
      </span>
      {active ? <StatusPill tone="good">active</StatusPill> : null}
    </button>
  );
}

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <SettingsRow
      label={label}
      control={
        <div className="flex w-full max-w-64 items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            aria-label={label}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-(--ui-fg)/15 accent-(--ui-fg)"
          />
          <SettingsValue mono>{display}</SettingsValue>
        </div>
      }
    />
  );
}
