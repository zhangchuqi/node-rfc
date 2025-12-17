import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Handle node-rfc native module
    config.externals = [...(config.externals || []), 'node-rfc'];
    return config;
  },
};

export default nextConfig;
