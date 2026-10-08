/**
 * Security headers applied to every route (pages and API) via next.config.mjs.
 * The CSP is report-only: browsers log violations to the console without
 * blocking anything. Switch the header name to `Content-Security-Policy`
 * after a week with no violations in production.
 * HSTS is intentionally absent; Netlify already sends it.
 */

/** @param {string | null | undefined} supabaseHostname omitted from the policy when falsy */
export function buildCsp(supabaseHostname) {
  const supabase = supabaseHostname ? `https://${supabaseHostname}` : '';
  const turnstile = 'https://challenges.cloudflare.com';
  // unpkg: Leaflet JS/CSS on /about (ClientsMap) until it is bundled locally.
  const unpkg = 'https://unpkg.com';

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${turnstile} ${unpkg}`,
    `style-src 'self' 'unsafe-inline' ${unpkg}`,
    // OSM tiles, Leaflet marker icons (cdnjs), YouTube facade thumbnails (i.ytimg.com).
    `img-src 'self' data: blob:${supabase ? ` ${supabase}` : ''} https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com https://i.ytimg.com`,
    `media-src 'self'${supabase ? ` ${supabase}` : ''}`,
    "font-src 'self'",
    `connect-src 'self'${supabase ? ` ${supabase}` : ''} ${turnstile}`,
    // posthog-js (and Next) may start workers from blob: URLs.
    "worker-src 'self' blob:",
    `frame-src https://www.youtube.com https://www.youtube-nocookie.com ${turnstile}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/** @param {string | null | undefined} supabaseHostname */
export function securityHeaders(supabaseHostname) {
  return [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Content-Security-Policy-Report-Only', value: buildCsp(supabaseHostname) },
  ];
}
