import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ["@gsd/types", "@gsd/utils"],
  turbopack: {
    resolveAlias: {
      buffer: { browser: "buffer/" },
      crypto: { browser: "crypto-browserify" },
      stream: { browser: "stream-browserify" },
    },
  },
};

export default nextConfig;
