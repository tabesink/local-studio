import { AppShell } from "@/features/navigation/AppShell";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
