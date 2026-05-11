import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/ppt",
  outputFileTracingRoot: __dirname,
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
