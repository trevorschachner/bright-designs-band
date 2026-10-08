/**
 * Netlify CDN caching for the two dynamic catalog pages, /shows and
 * /arrangements. They read searchParams, so Next marks every response
 * `Cache-Control: private, no-store` and each request would run the function.
 * The data under them is already tag-cached (lib/services/catalog.ts); these
 * headers let the CDN keep the rendered HTML and RSC payloads too.
 *
 * - Netlify-CDN-Cache-Control: up to 1 h fresh, then a day of
 *   stale-while-revalidate, `durable` so all edges share one cached object.
 *   The browser still gets Next's own private Cache-Control.
 * - Netlify-Cache-Tag: the list tags these pages read. The Netlify adapter
 *   purges a CDN tag of the same name on every revalidateTag(), so a write
 *   (lib/services/invalidate.ts) drops these pages within seconds; the 1 h
 *   s-maxage only bounds staleness if a purge is missed.
 * - Netlify-Vary: `query` keys the object on the whole query string, so
 *   `/shows?search=apex` is never served the cached `/shows`. The `header=`
 *   and `cookie=` parts repeat what @netlify/plugin-nextjs 5.16.2 adds itself
 *   (dist/run/headers.js `setVaryHeaders`): the adapter merges a route's own
 *   Netlify-Vary into its defaults rather than replacing it, but repeating
 *   them keeps HTML and RSC payloads apart even without that merge.
 *
 * Trade-off and verification: lib/services/README.md, "CDN cache for the
 * catalog pages".
 */

/** Request headers Next uses to produce an RSC payload (the adapter's list). */
const RSC_HEADERS = [
  'x-nextjs-data',
  'x-next-debug-logging',
  'next-router-prefetch',
  'next-router-segment-prefetch',
  'next-router-state-tree',
  'next-url',
  'rsc',
];

/** Preview / draft-mode cookies (the adapter's list). */
const PREVIEW_COOKIES = ['__prerender_bypass', '__next_preview_data'];

export const CATALOG_CDN_PATHS = ['/shows', '/arrangements'];

export const CATALOG_CDN_HEADERS = [
  {
    key: 'Netlify-CDN-Cache-Control',
    value: 'public, durable, s-maxage=3600, stale-while-revalidate=86400',
  },
  // Comma-separated, matching the tag names in lib/cache-tags.ts exactly.
  { key: 'Netlify-Cache-Tag', value: 'shows,arrangements,tags' },
  {
    key: 'Netlify-Vary',
    value: `query,header=${RSC_HEADERS.join('|')},cookie=${PREVIEW_COOKIES.join('|')}`,
  },
];

/** next.config `headers()` entries. A path-only source also matches with a query string. */
export function catalogCdnHeaderRules() {
  return CATALOG_CDN_PATHS.map((source) => ({ source, headers: CATALOG_CDN_HEADERS }));
}
