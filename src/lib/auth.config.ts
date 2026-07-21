import type { NextAuthConfig } from "next-auth";

// Edge-совместимая часть конфигурации NextAuth (без Credentials-провайдера,
// который тянет за собой Prisma/bcrypt — не работают в Edge-рантайме).
// Используется в middleware.ts. Полная конфигурация — в auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as "ADMIN" | "EMPLOYEE";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "EMPLOYEE";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
