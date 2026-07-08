import Link from "next/link";
import { FEATURES } from "../../../lib/features";

export default function FeatureNotFound() {
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col gap-4 px-4 py-16">
      <h1 className="text-[length:var(--fs-xl)] font-medium">Feature not found</h1>
      <p className="text-[length:var(--fs-sm)] text-(--ui-muted)">
        Choose one of the available demo slices:
      </p>
      <ul className="grid gap-2">
        {FEATURES.map((feature) => (
          <li key={feature.slug}>
            <Link
              href={`/features/${feature.slug}`}
              className="text-[length:var(--fs-sm)] text-(--ui-info) hover:underline"
            >
              {feature.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
