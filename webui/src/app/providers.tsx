"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Toaster } from "sonner";

import {
  DEFAULT_THEME,
  isThemeName,
  THEME_STORAGE_KEY,
  type ThemeName,
} from "@/lib/theme/themes";

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.remove("theme-zai-dark", "theme-zai-light");
  document.documentElement.classList.add(`theme-${theme}`);
}

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const nextTheme = isThemeName(storedTheme) ? storedTheme : DEFAULT_THEME;
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const setTheme = useCallback((nextTheme: ThemeName) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "zai-dark" ? "zai-light" : "zai-dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <Toaster
        position="bottom-right"
        theme={theme === "zai-dark" ? "dark" : "light"}
        toastOptions={{
          style: {
            background: "var(--ui-popover)",
            border: "1px solid var(--ui-border)",
            borderRadius: "var(--rad-lg)",
            color: "var(--ui-fg)",
            fontSize: "var(--fs-md)",
          },
        }}
      />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useTheme must be used within Providers");
  }

  return value;
}
