/**
 * Canonical site origin (no trailing slash).
 * Used for NextAuth redirects, NEXTAUTH_URL injection in next.config, and server-side absolute URLs.
 *
 * Priority:
 * 1. AUTH_URL, NEXTAUTH_URL, or NEXT_PUBLIC_APP_URL when set and not localhost
 * 2. VERCEL_URL on Vercel (automatic preview/production host)
 * 3. http://localhost:3000 for local development
 */
export function getAppBaseUrl(): string {
  const candidates = [
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const trimmed = raw.trim().replace(/\/$/, "");
    if (!trimmed) continue;
    if (/localhost|127\.0\.0\.1/i.test(trimmed)) continue;
    try {
      const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      return new URL(withScheme).origin;
    } catch {
      continue;
    }
  }

  if (process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}
