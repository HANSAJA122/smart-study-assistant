import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { isGoogleOAuthConfigured } from "@/lib/auth-google";

function LoginFallback() {
  return (
    <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm animate-pulse h-[420px]" />
  );
}

export default function LoginPage() {
  const googleEnabled = isGoogleOAuthConfigured();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm googleEnabled={googleEnabled} />
      </Suspense>
    </div>
  );
}
