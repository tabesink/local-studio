import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    externalDir: true,
  },
  webpack: (config) => {
    // _shared and features live outside the app root; make sure their bare
    // imports (lucide-react, react, ...) resolve from this app's node_modules.
    config.resolve.modules = [
      path.resolve(__dirname, "node_modules"),
      ...(config.resolve.modules ?? ["node_modules"]),
    ];
    return config;
  },
};

export default nextConfig;
