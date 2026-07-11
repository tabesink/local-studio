"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyAppearance,
  applyThemeId,
  applyThemeMode,
  defaultAppearance,
  patchAppearance,
  patchToken,
  readAppearance,
  resetTokens,
  resolveTokens,
  writeAppearance,
  type AppearancePreferences,
  type DensityId,
  type ThemeId,
  type ThemeMode,
  type ThemeTokens,
} from "./appearanceRuntime.ts";
import { fontFamilies, themeCatalog } from "./themeCatalog.ts";
import type { ThemeMeta } from "./appearanceTypes.ts";

type AppearanceContextValue = {
  preferences: AppearancePreferences;
  hydrated: boolean;
  themes: ThemeMeta[];
  fontFamilies: typeof fontFamilies;
  activeTheme: ThemeMeta;
  tokens: ThemeTokens;
  setThemeMode: (mode: ThemeMode) => void;
  setThemeId: (themeId: ThemeId) => void;
  setDensity: (density: DensityId) => void;
  patchPreference: (patch: Partial<AppearancePreferences>) => void;
  patchToken: (key: keyof ThemeTokens, value: string) => void;
  resetTokens: () => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function commit(prefs: AppearancePreferences) {
  writeAppearance(prefs);
  if (typeof document !== "undefined") {
    applyAppearance(document.documentElement, prefs);
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<AppearancePreferences>(defaultAppearance);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const next = readAppearance();
    setPreferences(next);
    applyAppearance(document.documentElement, next);
    setHydrated(true);
  }, []);

  const update = useCallback((recipe: (current: AppearancePreferences) => AppearancePreferences) => {
    setPreferences((current) => {
      const next = recipe(current);
      commit(next);
      return next;
    });
  }, []);

  const setThemeMode = useCallback(
    (themeMode: ThemeMode) => {
      update((current) => applyThemeMode(current, themeMode));
    },
    [update],
  );

  const setThemeId = useCallback(
    (themeId: ThemeId) => {
      update((current) => applyThemeId(current, themeId));
    },
    [update],
  );

  const setDensity = useCallback(
    (density: DensityId) => {
      update((current) => patchAppearance(current, { density }));
    },
    [update],
  );

  const patchPreference = useCallback(
    (patch: Partial<AppearancePreferences>) => {
      update((current) => patchAppearance(current, patch));
    },
    [update],
  );

  const patchTokenValue = useCallback(
    (key: keyof ThemeTokens, value: string) => {
      update((current) => patchToken(current, key, value));
    },
    [update],
  );

  const resetTokenOverrides = useCallback(() => {
    update((current) => resetTokens(current));
  }, [update]);

  const activeTheme = useMemo(
    () => themeCatalog.find((theme) => theme.id === preferences.themeId) ?? themeCatalog[0],
    [preferences.themeId],
  );

  const tokens = useMemo(() => resolveTokens(preferences), [preferences]);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      preferences,
      hydrated,
      themes: themeCatalog,
      fontFamilies,
      activeTheme,
      tokens,
      setThemeMode,
      setThemeId,
      setDensity,
      patchPreference,
      patchToken: patchTokenValue,
      resetTokens: resetTokenOverrides,
    }),
    [
      preferences,
      hydrated,
      activeTheme,
      tokens,
      setThemeMode,
      setThemeId,
      setDensity,
      patchPreference,
      patchTokenValue,
      resetTokenOverrides,
    ],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return ctx;
}
