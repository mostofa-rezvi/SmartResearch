import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ["localhost", "192.168.0.145"],
  },
};

export default nextConfig;
