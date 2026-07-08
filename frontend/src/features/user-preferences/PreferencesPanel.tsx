"use client";

import { useEffect, useState } from "react";
import { SegmentedControl, SettingsGroup, SettingsRow } from "@/_shared/ui";
import { readUiPreference, writeUiPreference } from "@/lib/storage";

/* Browser-local appearance preferences (LS user-preferences slice).
   No server API: values live on the ce.* storage allowlist only. */
export function PreferencesPanel() {
  const [theme, setTheme] = useState("zai-dark");
  const [density, setDensity] = useState("compact");

  useEffect(() => {
    setTheme(readUiPreference("ce.theme") ?? "zai-dark");
    setDensity(readUiPreference("ce.density") ?? "compact");
  }, []);

  return (
    <SettingsGroup title="Appearance" description="Preferences apply to this browser only.">
      <SettingsRow
        label="Theme"
        control={
          <SegmentedControl
            value={theme}
            items={[
              { id: "zai-dark", label: "Dark" },
              { id: "zai-light", label: "Light" },
            ]}
            onChange={(value) => {
              setTheme(value);
              writeUiPreference("ce.theme", value);
              document.documentElement.dataset.theme = value;
            }}
          />
        }
      />
      <SettingsRow
        label="Density"
        control={
          <SegmentedControl
            value={density}
            items={[
              { id: "compact", label: "Compact" },
              { id: "comfortable", label: "Comfortable" },
            ]}
            onChange={(value) => {
              setDensity(value);
              writeUiPreference("ce.density", value);
              document.documentElement.dataset.density = value;
            }}
          />
        }
      />
    </SettingsGroup>
  );
}
