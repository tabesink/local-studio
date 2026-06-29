export const THEME_STORAGE_KEY = "context-engine-theme";

export const themes = ["zai-dark", "zai-light"] as const;

export type ThemeName = (typeof themes)[number];

export const DEFAULT_THEME: ThemeName = "zai-dark";

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && themes.includes(value as ThemeName);
}
