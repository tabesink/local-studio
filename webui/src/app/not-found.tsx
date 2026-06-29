import { AppErrorState } from "@/components/shared/AppErrorState";

export default function NotFound() {
  return (
    <AppErrorState
      title="Not found"
      message="This Context Engine route is not available."
    />
  );
}
