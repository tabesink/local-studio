"use client";

import { useCallback, useEffect, useState } from "react";
import { loadSettingsPanelSnapshot } from "../api";
import { settingsSections } from "../constants";
import { settingsPanelSnapshot } from "../fixtures";
import type { SettingsPanelSnapshot, SettingsSectionId } from "../types";

const SECTION_IDS = new Set(settingsSections.map((section) => section.id));

function readSectionFromHash(fallback: SettingsSectionId): SettingsSectionId {
  if (typeof window === "undefined") return fallback;
  const hash = window.location.hash.replace(/^#/, "");
  return SECTION_IDS.has(hash as SettingsSectionId) ? (hash as SettingsSectionId) : fallback;
}

export function useSettingsPanel(defaultSection: SettingsSectionId = "connection") {
  const [activeSection, setActiveSectionState] = useState<SettingsSectionId>(defaultSection);
  const [snapshot, setSnapshot] = useState<SettingsPanelSnapshot>(settingsPanelSnapshot);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveSectionState(readSectionFromHash(defaultSection));
  }, [defaultSection]);

  /* Selecting a section updates state and the URL hash, mirroring
     window.history.replaceState(..., "#section") in the reference. */
  const setActiveSection = useCallback((section: SettingsSectionId) => {
    setActiveSectionState(section);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${section}`);
    }
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    const next = await loadSettingsPanelSnapshot();
    setSnapshot(next);
    setLoading(false);
  }, []);

  return {
    activeSection,
    loading,
    reload,
    sections: settingsSections,
    setActiveSection,
    snapshot,
  };
}
