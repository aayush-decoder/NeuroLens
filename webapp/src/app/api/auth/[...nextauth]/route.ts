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
        // ✅ Proper type validation (VERY IMPORTANT)
        if (
          !credentials ||
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const email = credentials.email;
        const password = credentials.password;

        let user: Awaited<ReturnType<typeof prisma.user.findUnique>> = null;

        try {
          user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) return null;

          // ✅ Compare hashed password
          const isValid = await bcrypt.compare(password, user.password);

          if (!isValid) {
            // 🔥 Dev fallback (optional)
            if (user.password === password) {
              const newHash = await bcrypt.hash(password, 10);

              await prisma.user.update({
                where: { id: user.id },
                data: { password: newHash },
              });
            } else {
              return null;
            }
          }
        } catch (error) {
          console.error("AUTH ERROR:", error);
          return null;
        }

        // ✅ Return user object (Auth.js expects this)
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