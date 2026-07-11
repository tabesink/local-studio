import type { ThemeMeta, ThemeTokens, UiPreferences } from "../types";

/* Theme catalogue mirrored from src/lib/themes-data.ts in the reference:
   two canonical themes plus four dark accent variants. */

const ZAI_LIGHT: ThemeTokens = {
  bg: "#f4f5f5",
  fg: "#202123",
  dim: "#20212399",
  border: "#0d0d0d1a",
  surface: "#fbfbfb",
  accent: "#000000",
  hl1: "#6b8db5",
  hl2: "#2f8f5f",
  hl3: "#c8792f",
  err: "#e03131",
};

const ZAI_DARK: ThemeTokens = {
  bg: "#0f0f0f",
  fg: "#e7e7e7",
  dim: "#e7e7e799",
  border: "#ffffff14",
  surface: "#202020",
  accent: "#ffffff",
  hl1: "#7ea1c8",
  hl2: "#4aa06f",
  hl3: "#d48a4c",
  err: "#ff5c5c",
};

const withAccent = (base: ThemeTokens, accent: string): ThemeTokens => ({
  ...base,
  accent,
  hl1: accent,
});

const createTheme = (
  id: ThemeMeta["id"],
  name: string,
  description: string,
  group: string,
  tokens: ThemeTokens,
): ThemeMeta => ({
  id,
  name,
  description,
  group,
  swatches: [tokens.bg, tokens.surface, tokens.accent, tokens.fg],
  tokens,
});

export const themeCatalog: ThemeMeta[] = [
  createTheme(
    "zai-dark",
    "Codex Dark",
    "Codex workbench — charcoal layers, quiet borders, muted data accents",
    "Codex",
    ZAI_DARK,
  ),
  createTheme(
    "zai-light",
    "Codex Light",
    "Codex light — paper canvas, black brand, muted data accents",
    "Codex",
    ZAI_LIGHT,
  ),
  createTheme("zai-sky", "Sky", "Codex dark with a sky-blue brand accent", "Accents", withAccent(ZAI_DARK, "#4099ff")),
  createTheme(
    "zai-violet",
    "Violet",
    "Codex dark with a violet brand accent",
    "Accents",
    withAccent(ZAI_DARK, "#7b5ce5"),
  ),
  createTheme(
    "zai-emerald",
    "Emerald",
    "Codex dark with an emerald brand accent",
    "Accents",
    withAccent(ZAI_DARK, "#46bf72"),
  ),
  createTheme("zai-rose", "Rose", "Codex dark with a rose brand accent", "Accents", withAccent(ZAI_DARK, "#ff5c5c")),
];

export const fontFamilies = [
  { id: "geist", label: "Geist", stack: `"Geist", ui-sans-serif, system-ui, sans-serif` },
  { id: "inter", label: "Inter", stack: `"Inter", ui-sans-serif, system-ui, sans-serif` },
  { id: "system", label: "System", stack: `ui-sans-serif, system-ui, sans-serif` },
];

export const defaultPreferences: UiPreferences = {
  themeMode: "dark",
  themeId: "zai-dark",
  fontFamilyId: "geist",
  fontSize: 16,
  uiScale: 1,
  radiusBase: 7,
  tokenOverrides: {},
};

export const defaultTokens = ZAI_DARK;
