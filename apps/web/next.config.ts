import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.LUMI_DIST_DIR ?? ".next",
  // The local demo is opened through both localhost and 127.0.0.1 by its
  // browser smoke test. Next otherwise blocks its own dev HMR endpoint.
  allowedDevOrigins: ["localhost", "127.0.0.1"]
};

export default nextConfig;
