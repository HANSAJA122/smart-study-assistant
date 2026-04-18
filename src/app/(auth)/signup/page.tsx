import { Suspense } from "react";
import { SignupForm } from "./signup-form";
import { isGoogleOAuthConfigured } from "@/lib/auth-google";

function SignupFallback() {
  return (
    <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm animate-pulse h-[520px]" />
  );
}

export default function SignupPage() {
  const googleEnabled = isGoogleOAuthConfigured();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={<SignupFallback />}>
        <SignupForm googleEnabled={googleEnabled} />
      </Suspense>
    </div>
  );
}
