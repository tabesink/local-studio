"use client";

import { SegmentedControl, SettingsGroup, SettingsRow } from "@/_shared/ui";
import { useAppearance } from "@/features/user-preferences/AppearanceProvider";
import type { DensityId } from "@/features/user-preferences/appearanceTypes";

/* Browser-local appearance preferences — thin General surface until U3 expands
   Mode / Theme catalog / editor. All writes go through AppearanceProvider. */
export function PreferencesPanel() {
  const { preferences, setThemeId, setDensity } = useAppearance();

  return (
    <SettingsGroup title="Appearance" description="Preferences apply to this browser only.">
      <SettingsRow
        label="Theme"
        control={
          <SegmentedControl
            value={preferences.themeId === "zai-light" ? "zai-light" : "zai-dark"}
            items={[
              { id: "zai-dark", label: "Dark" },
              { id: "zai-light", label: "Light" },
            ]}
            onChange={(value) => {
              setThemeId(value === "zai-light" ? "zai-light" : "zai-dark");
            }}
          />
        }
      />
      <SettingsRow
        label="Density"
        control={
          <SegmentedControl
            value={preferences.density}
            items={[
              { id: "compact", label: "Compact" },
              { id: "comfortable", label: "Comfortable" },
            ]}
            onChange={(value) => setDensity(value as DensityId)}
          />
        }
      />
    </SettingsGroup>
  );
}
