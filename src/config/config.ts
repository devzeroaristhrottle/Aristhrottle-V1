"use client";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonAmoy } from "viem/chains";

export const config = getDefaultConfig({
  appName: "Aristhrottle",
  projectId: "4d64bb10aea0ca389a3713d24fb0fabe",
  chains: [polygonAmoy],
  ssr: true, // If your dApp uses server side rendering (SSR),
});

// chains: [mainnet, polygon, optimism, arbitrum, base],
