import type { NextConfig } from "next";

const apiBase = process.env.CONTEXT_ENGINE_API_BASE?.replace(/\/+$/, "") ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBase}/api/v1/:path*`,
      },
      {
        source: "/health/:path*",
        destination: `${apiBase}/health/:path*`,
      },
    ];
  },
};

export default nextConfig;
