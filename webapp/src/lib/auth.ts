import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (
          !credentials ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) return null;

        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          return { id: user.id, email: user.email, name: user.username };
        } catch {
          return null;
        }
      },
    }),
  ],

  pages: { signIn: "/sign-in" },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as typeof session.user & { id: string }).id = token.id as string;
        session.user.name = token.username as string;
      }
      return session;
    },
  },
});

// Re-export authOptions shape for routes that use NextAuth(authOptions) pattern
export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [],
};
