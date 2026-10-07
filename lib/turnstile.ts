import { getTurnstileSecret } from '@/lib/env.server'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TIMEOUT_MS = 5000

let warnedMissingSecret = false

/**
 * Verify a Cloudflare Turnstile token server-side.
 *
 * Returns false on every failure — a rejected token, a network error, a
 * timeout, a non-2xx response, a malformed body. A captcha that fails open is
 * no captcha.
 *
 * Missing `TURNSTILE_SECRET_KEY`:
 * - production: misconfiguration. Every submission is rejected and the
 *   problem is logged once per process, so a forgotten env var shows up as a
 *   broken form rather than an open relay.
 * - development / test: verification is skipped (returns true) so the form
 *   works locally without a Cloudflare account. lib/env.ts gives the client
 *   Cloudflare's always-pass test site key in the same situation. To exercise
 *   real verification locally, set Cloudflare's test secret
 *   `1x0000000000000000000000000000000AA` (always passes) or
 *   `2x0000000000000000000000000000000AA` (always fails).
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = getTurnstileSecret()
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      if (!warnedMissingSecret) {
        warnedMissingSecret = true
        console.error('[turnstile] TURNSTILE_SECRET_KEY is not set; rejecting all submissions')
      }
      return false
    }
    return true
  }

  if (!token) return false

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const form = new FormData()
    form.append('secret', secret)
    form.append('response', token)
    if (ip && ip !== 'unknown') form.append('remoteip', ip)

    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    })
    if (!res.ok) return false
    const body = (await res.json()) as { success?: unknown }
    return body?.success === true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
