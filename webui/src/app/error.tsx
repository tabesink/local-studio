"use client";

import { AppErrorState } from "@/components/shared/AppErrorState";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppErrorState
      title="Something went wrong"
      message="The workbench could not finish loading."
      action={{ label: "Try again", onClick: reset }}
    />
  );
}
