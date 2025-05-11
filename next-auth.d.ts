import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      address?: string; // ✅ Add this line
    };
  }

  interface User {
    address?: string; // ✅ Add address to User type
  }

  interface Session {
    user: User; // ✅ Make sure Session.user uses our extended User type
    address: string;
  }

  interface JWT {
    address?: string; // ✅ Ensure JWT can hold address
  }
}
