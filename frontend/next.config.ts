import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Required for monorepo: tells Next.js the repo root is one level up
  // Fixes "detected multiple lockfiles" warning and Vercel 404 issue
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
