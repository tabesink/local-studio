import { AppPageFrame } from "@/components/layout/AppPageFrame";
import { PageState } from "@/components/ui/PageState";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <AppPageFrame>
      <PageState title="Chat" message="No conversation selected." />
    </AppPageFrame>
  );
}
