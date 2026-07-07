import { AppPageFrame } from "@/components/layout/AppPageFrame";
import { PageState } from "@/components/ui/PageState";

export default function ForbiddenPage() {
  return (
    <AppPageFrame>
      <PageState title="Forbidden" message="You do not have access to this surface." tone="danger" />
    </AppPageFrame>
  );
}
