import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
  },
  webpack: (config) => {
    config.turbo,
    config.externals.push(
      "pino-pretty" /* add any other modules that might be causing the error */
    );
    return config;
  },
};

export default nextConfig;
