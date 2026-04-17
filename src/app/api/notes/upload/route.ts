import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-security";

// File upload temporarily disabled for production build.
// Re-enable by restoring extraction logic and validating multipart body with Zod.

export async function POST() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    console.warn("[api] notes/upload POST: unauthenticated");
    return authResult;
  }

  return NextResponse.json(
    { error: "File upload is temporarily unavailable. Please type your notes manually." },
    { status: 503 }
  );
}
