import type { NextConfig } from "next";

// NEXT_BASE_PATH lets the same build be served from a sub-path, e.g. the
// arsher.is-a.dev/preview/ copy of the redesign.
const basePath = process.env.NEXT_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Client code that builds asset URLs by hand (e.g. the avatar) reads this.
  env: { NEXT_PUBLIC_BASE_PATH: basePath ?? "" },
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
