// import { authOptions } from "@/utils/authOptions";
// import NextAuth from "next-auth";

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };

// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ethers } from "ethers";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
        wallet: { label: "Wallet", type: "text" },
      },
      async authorize(credentials) {
        try {
          const { message, signature, wallet } = credentials as {
            message: string;
            signature: string;
            wallet: string;
          };

          const recovered = ethers.verifyMessage(message, signature);

          if (recovered.toLowerCase() !== wallet.toLowerCase()) {
            return null;
          }

          return { id: wallet, address: wallet };
        } catch (error) {
          console.error("Auth error", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.address = user.address;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.address && typeof token?.address === "string") {
        session.address = token.address;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
