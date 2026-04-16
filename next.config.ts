import type { NextConfig } from "next";
import { getAppBaseUrl } from "./src/lib/app-url";

const nextConfig: NextConfig = {
  // next-auth/react reads NEXTAUTH_URL at build time for server-side session fetch / redirects.
  // Map AUTH_URL (Auth.js v5) and Vercel's VERCEL_URL into NEXTAUTH_URL so production never falls back to localhost.
  env: {
    NEXTAUTH_URL: getAppBaseUrl(),
  },
};

export default nextConfig;
