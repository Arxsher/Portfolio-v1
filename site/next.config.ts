import type { NextConfig } from "next";

// NEXT_BASE_PATH lets the same build be served from a sub-path, e.g. the
// arsher.is-a.dev/preview/ copy of the redesign.
const basePath = process.env.NEXT_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
