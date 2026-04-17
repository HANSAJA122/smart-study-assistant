import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { consumeAiRateLimit, consumeRegisterRateLimit } from "@/lib/api-rate-limit";
import { getAppBaseUrl } from "@/lib/app-url";

export const UNAUTHORIZED = NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export function rateLimitResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again in a moment." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

/**
 * Returns the authenticated user's id after verifying the session and that the user row exists.
 * Use this for all protected APIs so sessions cannot reference deleted users.
 */
export async function getVerifiedUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;
  const id = session.user.id;
  if (!id || typeof id !== "string") return null;

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true },
  });
  return user?.id ?? null;
}

/** @deprecated Use getVerifiedUserId — alias for clarity in route code */
export const getCurrentUserId = getVerifiedUserId;

/**
 * If unauthenticated or user missing in DB, returns a 401 JSON response.
 * Otherwise returns the verified `userId` string.
 */
export async function requireAuth(): Promise<string | NextResponse> {
  const userId = await getVerifiedUserId();
  if (!userId) return UNAUTHORIZED;
  return userId;
}

export function requireAiRateLimit(userId: string): true | NextResponse {
  const max = Math.min(60, Math.max(5, Number(process.env.AI_RATE_LIMIT_PER_MINUTE) || 15));
  const result = consumeAiRateLimit(userId, max);
  if (!result.ok) {
    console.warn("[api-security] AI rate limit exceeded", { userId: userId.slice(0, 8) });
    return rateLimitResponse(result.retryAfterSec);
  }
  return true;
}

export function requireRegisterRateLimit(req: Request): true | NextResponse {
  const max = Math.min(30, Math.max(3, Number(process.env.REGISTER_RATE_LIMIT_PER_MINUTE) || 10));
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown";
  const result = consumeRegisterRateLimit(ip, max);
  if (!result.ok) {
    console.warn("[api-security] Registration rate limit exceeded", { ip: ip.slice(0, 20) });
    return rateLimitResponse(result.retryAfterSec);
  }
  return true;
}

/** Safe JSON parse for request bodies; avoids throwing on malformed JSON. */
export async function parseJsonBody(req: Request): Promise<unknown | NextResponse> {
  try {
    const text = await req.text();
    if (text.length > 1_000_000) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }
    if (!text.trim()) return {};
    return JSON.parse(text) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}

/**
 * Maps errors to safe client messages. Logs full error server-side only.
 */
export function handleApiError(
  error: unknown,
  context: string,
  options?: { fallbackMessage?: string }
): NextResponse {
  console.error(`[api] ${context}:`, error);

  const fallback = options?.fallbackMessage ?? "Something went wrong. Please try again.";

  if (error instanceof Error) {
    const m = error.message.toLowerCase();
    if (
      m.includes("cannot connect") ||
      m.includes("not available") ||
      m.includes("econnrefused") ||
      m.includes("network")
    ) {
      return NextResponse.json(
        { error: "The AI service is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    if (m.includes("authentication failed") || (m.includes("invalid") && m.includes("key"))) {
      return NextResponse.json({ error: "AI configuration error. Please contact support." }, { status: 502 });
    }
  }

  return NextResponse.json({ error: fallback }, { status: 500 });
}

/**
 * Optional strict origin check for state-changing requests.
 * Enable with API_STRICT_ORIGIN=1 in production if all clients send a correct Origin header.
 */
export function assertTrustedOrigin(req: Request): NextResponse | null {
  if (process.env.API_STRICT_ORIGIN !== "1") return null;

  const origin = req.headers.get("origin");
  if (!origin) return null;

  let allowed: string;
  try {
    allowed = new URL(getAppBaseUrl()).origin;
  } catch {
    return null;
  }

  try {
    if (new URL(origin).origin !== allowed) {
      console.warn("[api-security] Blocked request: untrusted Origin", { origin });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
