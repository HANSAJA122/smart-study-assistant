"use client";

import { SessionProvider } from "next-auth/react";

export function SessionRoot({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
