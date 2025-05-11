import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.message || !credentials?.signature) return null;

        const siweMessage = new SiweMessage(credentials.message);
        const { success } = await siweMessage.verify({
          signature: credentials.signature,
        });

        if (success) {
          return { id: siweMessage.address, address: siweMessage.address };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.address = user.address; // ✅ Store address in JWT token
      }
      return token;
    },
    async session({ session, token }) {
      if (token.address && typeof token.address == "string") {
        session.user.address = token.address; // ✅ Store token address in session
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
