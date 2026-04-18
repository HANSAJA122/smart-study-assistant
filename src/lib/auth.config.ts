import "./auth-env";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getAppBaseUrl } from "./app-url";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Authorize is handled in the full auth.ts that has access to DB
      async authorize() {
        return null;
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const origin = getAppBaseUrl();
      if (url.startsWith("/")) return `${origin}${url}`;
      try {
        const target = new URL(url);
        if (target.origin === new URL(origin).origin) return url;
        try {
          if (target.origin === new URL(baseUrl).origin) return url;
        } catch {
          /* ignore invalid baseUrl */
        }
      } catch {
        /* ignore malformed url */
      }
      return origin;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = [
        "/dashboard",
        "/notes",
        "/quiz",
        "/flashcards",
        "/planner",
        "/chat",
        "/progress",
        "/profile",
      ];
      const isProtected = protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );
      const isAuthRoute =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/signup");

      if (isProtected && !isLoggedIn) {
        return false; // Redirects to signIn page
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        if (typeof token.email === "string") session.user.email = token.email;
        if (token.name !== undefined) session.user.name = token.name;
        if (token.picture !== undefined) session.user.image = token.picture;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (user) {
        if (user.email) token.email = user.email;
        if ("name" in user) token.name = user.name;
        if ("image" in user) token.picture = user.image;
      }
      return token;
    },
  },
};
