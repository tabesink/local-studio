"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { readUiPreference } from "@/lib/storage";
import { useAuthStore } from "@/state/auth-store";

export function Providers({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const markUnauthenticated = useAuthStore((state) => state.markUnauthenticated);

  useEffect(() => {
    document.documentElement.dataset.theme = readUiPreference("ce.theme") ?? "zai-dark";
    document.documentElement.dataset.density = readUiPreference("ce.density") ?? "compact";
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      markUnauthenticated();
    });
    void bootstrap();
    return () => setUnauthorizedHandler(null);
  }, [bootstrap, markUnauthenticated]);

  return <AppLayout>{children}</AppLayout>;
}
