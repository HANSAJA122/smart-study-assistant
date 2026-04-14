import { Loader2 } from "lucide-react";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2 className={`h-6 w-6 animate-spin text-primary ${className || ""}`} />
  );
}

export function LoadingPage() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-muted mb-4" />
      <div className="h-3 w-full rounded bg-muted mb-2" />
      <div className="h-3 w-5/6 rounded bg-muted mb-2" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}
