import { AppPageFrame } from "@/components/layout/AppPageFrame";
import { PageState } from "@/components/ui/PageState";

export const dynamic = "force-dynamic";

export default function DocumentsPage() {
  return (
    <AppPageFrame>
      <PageState title="Documents" message="No Source Documents loaded." />
    </AppPageFrame>
  );
}
