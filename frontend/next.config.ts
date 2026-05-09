import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
} as any;

// @ts-ignore
nextConfig.allowedDevOrigins = ["localhost", "192.168.0.145"];

export default nextConfig;
