import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Ensure env variables are available at runtime
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "**",
      },
    ],
  },
  transpilePackages: [],
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
    turbo: {},
    serverComponentsExternalPackages: ['mongoose'],
  },
  webpack: (config) => {
    config.externals.push(
      "pino-pretty" /* add any other modules that might be causing the error */
    );
    return config;
  },
};

export default nextConfig;
