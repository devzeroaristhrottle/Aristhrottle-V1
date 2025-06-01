// import { authOptions } from "@/utils/authOptions";
// import NextAuth from "next-auth";

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };

// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ethers } from "ethers";
import User from "@/models/User";
import connectToDatabase from "@/lib/db";

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
        // Store wallet address in token
        token.address = user.address;
        
        // Connect to database
        await connectToDatabase();
        
        try {
          // Find user by wallet address to get MongoDB ID
          const dbUser = await User.findOne({ user_wallet_address: user.address });
          
          if (dbUser) {
            // Store MongoDB ID in token.sub
            token.sub = dbUser._id.toString();
          }
        } catch (error) {
          console.error("Error fetching user for JWT:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.address && typeof token?.address === "string") {
        session.address = token.address;
      }
      
      // Add userId to session for easy access
      if (token?.sub) {
        session.userId = token.sub;
      }
      
      return session;
    },
  },
});

export { handler as GET, handler as POST };
