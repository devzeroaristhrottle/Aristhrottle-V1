import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  },
  webpack: (config) => {
    config.externals.push(
      "pino-pretty" /* add any other modules that might be causing the error */
    );
    return config;
  },
};

export default nextConfig;
