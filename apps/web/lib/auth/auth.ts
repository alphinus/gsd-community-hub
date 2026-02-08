import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifySIWS } from "./siws";
import { prisma } from "@/lib/db/prisma";

declare module "next-auth" {
  interface Session {
    publicKey: string;
    user: {
      id: string;
    };
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "solana",
      name: "Solana",
      credentials: {
        input: { type: "text" },
        output: { type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.input || !credentials?.output) {
          return null;
        }

        const input = credentials.input as string;
        const output = credentials.output as string;

        // Verify the SIWS signature
        const walletAddress = verifySIWS(input, output);

        if (!walletAddress) {
          return null;
        }

        // Verify domain matches AUTH_URL to prevent phishing
        try {
          const inputParsed = JSON.parse(input);
          const authUrl = process.env.AUTH_URL || "http://localhost:3000";
          const expectedDomain = new URL(authUrl).host;
          if (inputParsed.domain && inputParsed.domain !== expectedDomain) {
            console.error(
              `SIWS: Domain mismatch. Expected ${expectedDomain}, got ${inputParsed.domain}`
            );
            return null;
          }
        } catch {
          // If domain verification fails, reject
          return null;
        }

        // Upsert user in database
        try {
          await prisma.user.upsert({
            where: { walletAddress },
            update: { updatedAt: new Date() },
            create: { walletAddress },
          });
        } catch (error) {
          // Database errors should not prevent authentication
          // The user can still be authenticated even if DB upsert fails
          console.error("SIWS: Database upsert error:", error);
        }

        return {
          id: walletAddress,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.publicKey = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.publicKey = token.publicKey as string;
      if (session.user) {
        session.user.id = token.publicKey as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  // AUTH_SECRET is automatically read from environment by Auth.js v5
});
