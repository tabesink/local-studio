"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { USER_PREFS_STORAGE_KEY } from "../constants";
import { defaultPreferences, fontFamilies, themeCatalog } from "../fixtures";
import type { ThemeId, ThemeMode, ThemeTokens, UiPreferences } from "../types";

function readStoredPreferences(): UiPreferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const raw = window.localStorage.getItem(USER_PREFS_STORAGE_KEY);
    if (!raw) return defaultPreferences;
    return { ...defaultPreferences, ...(JSON.parse(raw) as Partial<UiPreferences>) };
  } catch {
    return defaultPreferences;
  }
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UiPreferences>(defaultPreferences);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPreferences(readStoredPreferences());
    setHydrated(true);
  }, []);

  const activeTheme = useMemo(
    () => themeCatalog.find((theme) => theme.id === preferences.themeId) ?? themeCatalog[0],
    [preferences.themeId],
  );

  const tokens: ThemeTokens = useMemo(
    () => ({ ...activeTheme.tokens, ...preferences.tokenOverrides }),
    [activeTheme, preferences.tokenOverrides],
  );

  /* Persist and apply live to document variables — mirrors the reference
     theme runtime writing inline vars before paint. */
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(USER_PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // local-only preference; storage failures are non-fatal
    }
    const root = document.documentElement;
    const isLight = preferences.themeId === "zai-light";
    root.dataset.theme = isLight ? "zai-light" : "zai-dark";
    root.style.setProperty("--ui-scale", String(preferences.uiScale));
    root.style.setProperty("--radius-base", `${preferences.radiusBase}px`);
    root.style.setProperty("--app-font-size", `${preferences.fontSize}px`);
    const font = fontFamilies.find((family) => family.id === preferences.fontFamilyId);
    if (font) root.style.setProperty("--font-geist-sans", font.stack);
    for (const [key, value] of Object.entries(preferences.tokenOverrides)) {
      if (value) root.style.setProperty(`--${key}`, value);
    }
  }, [hydrated, preferences]);

  const patchPreference = useCallback((patch: Partial<UiPreferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

  const setThemeMode = useCallback((themeMode: ThemeMode) => {
    setPreferences((current) => ({
      ...current,
      themeMode,
      themeId:
        themeMode === "light"
          ? "zai-light"
          : themeMode === "dark" && current.themeId === "zai-light"
            ? "zai-dark"
            : current.themeId,
    }));
  }, []);

  const setThemeId = useCallback((themeId: ThemeId) => {
    setPreferences((current) => ({
      ...current,
      themeId,
      themeMode: themeId === "zai-light" ? "light" : "dark",
      tokenOverrides: {},
    }));
  }, []);

  const patchToken = useCallback((key: keyof ThemeTokens, value: string) => {
    setPreferences((current) => ({
      ...current,
      tokenOverrides: { ...current.tokenOverrides, [key]: value },
    }));
  }, []);

  const resetTokens = useCallback(() => {
    setPreferences((current) => ({ ...current, tokenOverrides: {} }));
  }, []);

  return {
    activeTheme,
    fontFamilies,
    hydrated,
    preferences,
    themes: themeCatalog,
    tokens,
    patchPreference,
    patchToken,
    resetTokens,
    setThemeId,
    setThemeMode,
  };
}
