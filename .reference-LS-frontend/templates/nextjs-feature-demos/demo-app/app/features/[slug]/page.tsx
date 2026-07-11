import Link from "next/link";
import { notFound } from "next/navigation";
import { getFeature } from "../../../lib/features";

type FeaturePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = getFeature(slug);

  if (!feature) {
    notFound();
  }

  const { Demo, title } = feature;

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-(--ui-border)/40 px-4">
        <Link
          href="/"
          className="rounded-md px-2 py-1 text-[length:var(--fs-sm)] text-(--ui-muted) hover:bg-(--ui-hover) hover:text-(--ui-fg)"
        >
          All features
        </Link>
        <span className="text-(--ui-muted)">/</span>
        <span className="truncate text-[length:var(--fs-sm)] font-medium">{title}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden">
        <Demo>
          <main className="flex min-h-full items-center justify-center bg-(--ui-bg) px-6 py-10 text-[length:var(--fs-sm)] text-(--ui-muted)">
            Main content area for sidebar demos.
          </main>
        </Demo>
      </div>
    </div>
  );
}
