"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { useAuthStore } from "@/state/auth-store";

export function Providers({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const markUnauthenticated = useAuthStore((state) => state.markUnauthenticated);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      markUnauthenticated();
    });
    void bootstrap();
    return () => setUnauthorizedHandler(null);
  }, [bootstrap, markUnauthenticated]);

  return (
    <AppLayout>
      {children}
      <SettingsDialog />
    </AppLayout>
  );
}
