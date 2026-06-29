"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/app/providers";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "zai-dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
      className="inline-flex h-[var(--ui-control-h)] w-[var(--ui-control-h)] items-center justify-center rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-input)] text-[var(--ui-fg-muted)] hover:border-[var(--ui-border-hover)] hover:bg-[var(--ui-hover)] hover:text-[var(--ui-fg)]"
    >
      {isDark ? <Moon aria-hidden size={14} /> : <Sun aria-hidden size={14} />}
    </button>
  );
}
