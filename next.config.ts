import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir la app desde el celular cuando está en el mismo WiFi
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;