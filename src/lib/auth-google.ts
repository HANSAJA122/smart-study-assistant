/**
 * Server-only: whether Google OAuth is configured (both ID and secret required).
 * Used to show or hide "Continue with Google" without exposing secrets to the client.
 */
export function isGoogleOAuthConfigured(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return Boolean(id && secret);
}
