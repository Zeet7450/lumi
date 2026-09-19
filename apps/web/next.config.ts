import type { NextConfig } from "next";

const nextConfig: NextConfig = { distDir: process.env.LUMI_DIST_DIR ?? ".next" };

export default nextConfig;
