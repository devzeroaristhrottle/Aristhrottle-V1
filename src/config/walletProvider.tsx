"use client";
import React, { useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/config/config";
import { SessionProvider } from "next-auth/react";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import { AlchemyAccountProvider } from "@account-kit/react";
import { alchemyConfig } from "./alchemyConfig";

type Props = {
  children: React.ReactNode;
};
export default function WalletProvider({ children }: Props) {
  const [session, setSession] = useState<Session>();

  const queryClient = new QueryClient();

  useEffect(() => {
    const getSession = async () => {
      const session = await getServerSession(authOptions);
      if (session != null) {
        setSession(session);
      }
    };
    getSession();
  }, []);

  return (
    <WagmiProvider config={config}>
      <SessionProvider refetchInterval={0} session={session}>
        <QueryClientProvider client={queryClient}>
          <AlchemyAccountProvider
            config={alchemyConfig}
            queryClient={queryClient}
          >
            {/* <RainbowKitSiweNextAuthProvider>
              <RainbowKitProvider
                coolMode
                theme={lightTheme({
                  // accentColor:"#111111"
                  accentColor: "#fff",
                  accentColorForeground: "#111111",
                })}
              > */}
            {children}
            {/* </RainbowKitProvider> */}
            {/* </RainbowKitSiweNextAuthProvider> */}
          </AlchemyAccountProvider>
        </QueryClientProvider>
      </SessionProvider>
    </WagmiProvider>
  );
}
