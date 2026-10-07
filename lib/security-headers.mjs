/**
 * Security headers applied to every route (pages and API) via next.config.mjs.
 * The CSP is report-only: browsers log violations to the console without
 * blocking anything. Switch the header name to `Content-Security-Policy`
 * after a week with no violations in production.
 * HSTS is intentionally absent; Netlify already sends it.
 */

/** @param {string} supabaseHostname */
export function buildCsp(supabaseHostname) {
  const supabase = `https://${supabaseHostname}`;
  const turnstile = 'https://challenges.cloudflare.com';
  // unpkg: Leaflet JS/CSS on /about (ClientsMap) until it is bundled locally.
  const unpkg = 'https://unpkg.com';
  // Google Analytics is only loaded when a measurement id is configured.
  const ga = 'https://www.googletagmanager.com';

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${turnstile} ${unpkg} ${ga}`,
    `style-src 'self' 'unsafe-inline' ${unpkg}`,
    // OSM tiles, Leaflet marker icons (cdnjs), GA pixels.
    `img-src 'self' data: blob: ${supabase} https://*.tile.openstreetmap.org https://cdnjs.cloudflare.com ${ga} https://*.google-analytics.com`,
    `media-src 'self' ${supabase}`,
    "font-src 'self'",
    `connect-src 'self' ${supabase} ${turnstile} https://*.google-analytics.com https://*.analytics.google.com ${ga}`,
    `frame-src https://www.youtube.com https://www.youtube-nocookie.com ${turnstile}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

/** @param {string} supabaseHostname */
export function securityHeaders(supabaseHostname) {
  return [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Content-Security-Policy-Report-Only', value: buildCsp(supabaseHostname) },
  ];
}
