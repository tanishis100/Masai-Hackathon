import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /** Compile the workspace UI package from source instead of expecting a build step. */
  transpilePackages: ["@repo/ui"],
}

export default nextConfig
