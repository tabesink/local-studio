"use client";

import { useCallback, useMemo, useState } from "react";

import type { SettingsSectionId } from "@/features/navigation/navigation";

export function useSettingsDialogState(defaultSection: SettingsSectionId = "general") {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SettingsSectionId>(defaultSection);

  const openSettings = useCallback((nextSection: SettingsSectionId = "general") => {
    setSection(nextSection);
    setOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setOpen(false);
  }, []);

  return useMemo(
    () => ({
      open,
      section,
      setOpen,
      setSection,
      openSettings,
      closeSettings,
    }),
    [closeSettings, open, openSettings, section],
  );
}
