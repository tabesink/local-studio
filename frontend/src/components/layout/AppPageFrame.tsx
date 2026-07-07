"use client";

import type { ReactNode } from "react";
import { AppSideRail } from "@/components/layout/AppSideRail";

export function AppPageFrame({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-screen p-3 sm:p-4">
      <div className="relative flex h-[calc(100vh-2rem)] min-h-[520px] w-full overflow-hidden rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--bg)]">
        <AppSideRail />
        <main className="min-w-0 flex-1 bg-[var(--bg)]">{children}</main>
      </div>
    </section>
  );
}
