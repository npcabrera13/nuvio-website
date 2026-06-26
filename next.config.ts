import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.metahub.space",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // Tell Next.js to not try to resolve cloudflare:sockets during build
  // It only exists at runtime on Cloudflare Workers
  serverExternalPackages: ["worker-mailer"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore cloudflare:sockets module during build — it's a runtime-only native module
      config.resolve = config.resolve || {};
      config.resolve.fallback = config.resolve.fallback || {};
      config.resolve.fallback["cloudflare:sockets"] = false;
      
      // Also handle it in externals
      config.externals = config.externals || [];
      config.externals.push({ "cloudflare:sockets": "cloudflare:sockets" });
    }
    return config;
  },
};

export default nextConfig;
