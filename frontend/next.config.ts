import type { NextConfig } from "next";

// API proxying lives in src/proxy.ts, not here: next.config.ts rewrites()
// resolves once at `next build` time and is baked into
// .next/routes-manifest.json, so it cannot react to a runtime-supplied
// CONTEXT_ENGINE_API_BASE (e.g. a Docker `-e` flag or compose environment
// value). Proxy runs per-request in the Node.js runtime and reads
// process.env at request time.
const nextConfig: NextConfig = {};

export default nextConfig;
