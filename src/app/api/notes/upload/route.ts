import { NextResponse } from "next/server";

// File upload temporarily disabled for production build.
// pdf-parse and mammoth removed to avoid Vercel bundling issues.
// Re-enable by restoring the original imports and extraction logic.

export async function POST() {
  return NextResponse.json(
    { error: "File upload is temporarily unavailable. Please type your notes manually." },
    { status: 503 }
  );
}
