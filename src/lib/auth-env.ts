/**
 * NextAuth middleware calls `reqWithEnvURL()` which replaces the request origin with
 * `AUTH_URL` / `NEXTAUTH_URL` when set. If those are still `localhost` on Vercel (common
 * copy-paste mistake), redirects to `/login` become `http://localhost:3000/login?...`.
 *
 * This module must load before `next-auth` middleware runs — import it first from
 * `middleware.ts` and `auth.config.ts`.
 */
if (process.env.VERCEL) {
  for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
    const v = process.env[key];
    if (v && /localhost|127\.0\.0\.1/i.test(v)) {
      delete process.env[key];
    }
  }
}
