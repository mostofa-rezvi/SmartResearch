import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
} as any;

// @ts-ignore
nextConfig.allowedDevOrigins = ["localhost", "192.168.0.145"];

export default nextConfig;
