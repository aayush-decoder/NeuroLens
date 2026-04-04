import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let user: Awaited<ReturnType<typeof prisma.user.findUnique>> = null;

        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            // Dev fallback for legacy rows that were stored as plain text.
            if (user.password === credentials.password) {
              const newHash = await bcrypt.hash(credentials.password, 10);
              await prisma.user.update({
                where: { id: user.id },
                data: { password: newHash },
              });
            } else {
              return null;
            }
          }
        } catch {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
        };
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    jwt: ({ token, user }: any) => {
      if (user) {
        token.id = user.id;
        token.username = user.name;
      }
      return token;
    },
    session: ({ session, token }: any) => {
      if (session?.user) {
        (session.user as any).id = token.id;
        session.user.name = token.username;
      }
      return session;
    },
  },
};

const auth = NextAuth(authOptions);

export const { GET, POST } = auth.handlers;