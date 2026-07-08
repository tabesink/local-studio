export type ThemeMode = "light" | "dark" | "system";

export type ThemeId =
  | "zai-light"
  | "zai-dark"
  | "zai-sky"
  | "zai-violet"
  | "zai-emerald"
  | "zai-rose";

export interface ThemeTokens {
  bg: string;
  fg: string;
  dim: string;
  border: string;
  surface: string;
  accent: string;
  hl1: string;
  hl2: string;
  hl3: string;
  err: string;
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  group: string;
  swatches: [string, string, string, string];
  tokens: ThemeTokens;
}

export interface UiPreferences {
  themeMode: ThemeMode;
  themeId: ThemeId;
  fontFamilyId: string;
  fontSize: number;
  uiScale: number;
  radiusBase: number;
  tokenOverrides: Partial<ThemeTokens>;
}
