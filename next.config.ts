import type { NextConfig } from "next";

/**
 * Do not inline NEXTAUTH_URL / AUTH_URL here. A build-time URL can disagree with your
 * real Vercel hostname and cause Google OAuth `redirect_uri_mismatch` (Google compares
 * the exact string). Set `AUTH_URL` (and optionally `NEXTAUTH_URL` to the same value)
 * in Vercel Environment Variables to your live origin, e.g. https://your-app.vercel.app
 */
const nextConfig: NextConfig = {};

export default nextConfig;
