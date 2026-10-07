import { sql } from 'drizzle-orm'
import { contactRateLimits } from '@/lib/database/schema'

/**
 * Fixed-window rate limit backed by Postgres (`contact_rate_limits`).
 *
 * Netlify runs each request in a fresh function instance, so any in-memory
 * counter is per-instance and effectively no limit at all. The counter lives in
 * the database instead and is bumped with one atomic upsert, so concurrent
 * requests from the same IP cannot both read a stale count.
 */

export type RateLimitOptions = { limit: number; windowMinutes: number }

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  /** Seconds until the current window closes; used for `Retry-After`. */
  retryAfterSeconds: number
}

const DEFAULTS: RateLimitOptions = { limit: 5, windowMinutes: 10 }

/** Start of the fixed window containing `now` (epoch-aligned, UTC). */
export function windowStartFor(now: Date, windowMinutes: number): Date {
  const windowMs = windowMinutes * 60_000
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs)
}

export async function consume(
  ip: string,
  options: RateLimitOptions = DEFAULTS,
  now: Date = new Date()
): Promise<RateLimitResult> {
  const { limit, windowMinutes } = options
  const windowStart = windowStartFor(now, windowMinutes)
  const windowEnd = windowStart.getTime() + windowMinutes * 60_000
  const retryAfterSeconds = Math.max(1, Math.ceil((windowEnd - now.getTime()) / 1000))

  try {
    const { db } = await import('@/lib/database')
    const rows = await db
      .insert(contactRateLimits)
      .values({ ip, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [contactRateLimits.ip, contactRateLimits.windowStart],
        set: { count: sql`${contactRateLimits.count} + 1` },
      })
      .returning({ count: contactRateLimits.count })

    const count = rows[0]?.count ?? 1
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds,
    }
  } catch (error) {
    // Fail open: a database outage must not take the contact form down with
    // it. Turnstile still gates the request.
    console.error('[rate-limit] counter unavailable, allowing request:', error)
    return { allowed: true, remaining: limit, retryAfterSeconds }
  }
}

/**
 * Client IP as Netlify reports it. `x-nf-client-connection-ip` is set by
 * Netlify's edge and cannot be supplied by the client; `x-forwarded-for` is the
 * fallback for other hosts and local dev.
 */
export function getClientIp(headers: Headers): string {
  const netlify = headers.get('x-nf-client-connection-ip')?.trim()
  if (netlify) return netlify
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  return 'unknown'
}
