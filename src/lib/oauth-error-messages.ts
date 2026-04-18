/** Maps Auth.js / NextAuth `error` query values to user-friendly copy (login/signup pages). */
export function messageForOAuthCallbackError(error: string | null): string | null {
  if (!error) return null;
  const map: Record<string, string> = {
    Configuration:
      "Sign-in is not configured correctly on the server. Please try again later.",
    AccessDenied: "Sign-in was cancelled or access was denied.",
    Verification: "The sign-in link is no longer valid. Please try again.",
    OAuthSignin: "Could not start Google sign-in. Please try again.",
    OAuthCallback: "Google sign-in did not finish. Please try again.",
    OAuthAccountNotLinked:
      "This email is already used with another sign-in method. Try email and password, or contact support.",
    Callback: "Something went wrong during sign-in. Please try again.",
  };
  return map[error] ?? "Sign-in failed. Please try again.";
}
