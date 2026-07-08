import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Studio Feature Demos",
  description: "Fixture-backed Next.js feature parity slices",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="zai-dark" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-full bg-(--ui-bg) text-(--ui-fg) antialiased">{children}</body>
    </html>
  );
}
