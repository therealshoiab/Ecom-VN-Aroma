import type { NextConfig } from "next";

// We run setupDevPlatform in development to mock Cloudflare bindings
if (process.env.NODE_ENV === "development") {
  import("@cloudflare/next-on-pages/next-dev").then(({ setupDevPlatform }) => {
    setupDevPlatform().catch((err) => {
      console.error("Failed to setup Cloudflare dev platform:", err);
    });
  });
}

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'async_hooks': 'node:async_hooks',
        'buffer': 'node:buffer',
        'events': 'node:events',
        'util': 'node:util',
        'stream': 'node:stream',
      };
    }
    return config;
  },
  turbopack: {
    resolveAlias: {
      'async_hooks': 'node:async_hooks',
      'buffer': 'node:buffer',
      'events': 'node:events',
      'util': 'node:util',
      'stream': 'node:stream',
    },
  },
};

export default nextConfig;
