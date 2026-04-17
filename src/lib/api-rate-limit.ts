/** In-memory fixed-window rate limiter (per server instance). For multi-instance scale, use Redis/Upstash. */

type Bucket = { windowStart: number; count: number };

const aiBuckets = new Map<string, Bucket>();
const registerBuckets = new Map<string, Bucket>();

const WINDOW_MS = 60_000;
const MAX_CLEAN = 500;

function prune(map: Map<string, Bucket>, now: number) {
  if (map.size <= MAX_CLEAN) return;
  for (const [k, v] of map) {
    if (now - v.windowStart > WINDOW_MS * 2) map.delete(k);
  }
}

export function consumeAiRateLimit(
  userId: string,
  maxPerWindow = 15
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(aiBuckets, now);
  let b = aiBuckets.get(userId);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    aiBuckets.set(userId, { windowStart: now, count: 1 });
    return { ok: true };
  }
  if (b.count >= maxPerWindow) {
    const retryAfterSec = Math.max(1, Math.ceil((b.windowStart + WINDOW_MS - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  b.count += 1;
  return { ok: true };
}

/** Limit anonymous registration abuse (keyed by IP). */
export function consumeRegisterRateLimit(
  ipKey: string,
  maxPerWindow = 10
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(registerBuckets, now);
  let b = registerBuckets.get(ipKey);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    registerBuckets.set(ipKey, { windowStart: now, count: 1 });
    return { ok: true };
  }
  if (b.count >= maxPerWindow) {
    const retryAfterSec = Math.max(1, Math.ceil((b.windowStart + WINDOW_MS - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  b.count += 1;
  return { ok: true };
}
