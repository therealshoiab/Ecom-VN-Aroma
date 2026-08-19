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
  /* config options here */
};

export default nextConfig;
