import { AppPageFrame } from "@/components/layout/AppPageFrame";
import { PageState } from "@/components/ui/PageState";

export const dynamic = "force-dynamic";

export default function DatabaseVisualizePage() {
  return (
    <AppPageFrame>
      <PageState title="Knowledge graph" message="Graph data is unavailable." />
    </AppPageFrame>
  );
}
