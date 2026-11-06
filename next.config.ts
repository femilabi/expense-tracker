import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: "/expenses/:path*",
        destination: "/dashboard/expenses/:path*",
        permanent: true,
      },
      {
        source: "/income",
        destination: "/dashboard/income",
        permanent: true,
      },
      {
        source: "/budget",
        destination: "/dashboard/budget",
        permanent: true,
      },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
