import { describe, it, expect } from 'vitest';
import nextConfig from '../../next.config.mjs';
import { buildCsp } from '../security-headers.mjs';

describe('security headers', () => {
  it('applies the five headers to every route', async () => {
    const entries = await nextConfig.headers!();
    const entry = entries.find((e) => e.source === '/(.*)');
    expect(entry).toBeDefined();
    const map = Object.fromEntries(entry!.headers.map((h) => [h.key, h.value]));
    expect(map['X-Frame-Options']).toBe('DENY');
    expect(map['X-Content-Type-Options']).toBe('nosniff');
    expect(map['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(map['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
    expect(map['Content-Security-Policy']).toBeUndefined();
    const csp = map['Content-Security-Policy-Report-Only'];
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('challenges.cloudflare.com');
    expect(csp).toContain('unpkg.com');
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toMatch(/img-src [^;]*https:\/\/i\.ytimg\.com/);
  });

  it('includes the Supabase origin when a hostname is given and omits it otherwise', () => {
    expect(buildCsp('abc.supabase.co')).toContain('https://abc.supabase.co');
    const csp = buildCsp(null);
    expect(csp).not.toContain('supabase');
    expect(csp).not.toContain('null');
    expect(csp).toContain("media-src 'self';");
  });
});

describe('catalog CDN cache headers', () => {
  for (const source of ['/shows', '/arrangements']) {
    it(`${source}: durable 1 h CDN cache, purged by the list tags, varied on the whole query`, async () => {
      const entries = await nextConfig.headers!();
      const entry = entries.find((e) => e.source === source);
      expect(entry).toBeDefined();
      const map = Object.fromEntries(entry!.headers.map((h) => [h.key, h.value]));
      expect(map['Netlify-CDN-Cache-Control']).toBe('public, durable, s-maxage=3600, stale-while-revalidate=86400');
      // Exact tag strings: the adapter purges these on revalidateTag().
      expect(map['Netlify-Cache-Tag']).toBe('shows,arrangements,tags');
      const vary = map['Netlify-Vary'].split(',');
      // Bare `query`: every filter, page and limit variant is its own object.
      expect(vary).toContain('query');
      // HTML and RSC payloads never share an object.
      const header = vary.find((v) => v.startsWith('header='))!.slice('header='.length).split('|');
      expect(header).toEqual(expect.arrayContaining(['rsc', 'next-router-state-tree', 'next-router-prefetch', 'next-url']));
      expect(vary).toContain('cookie=__prerender_bypass|__next_preview_data');
    });
  }

  it('is not applied to the show detail pages or the API', async () => {
    const entries = await nextConfig.headers!();
    const cdnSources = entries
      .filter((e) => e.headers.some((h) => h.key === 'Netlify-CDN-Cache-Control'))
      .map((e) => e.source);
    expect(cdnSources).toEqual(['/shows', '/arrangements']);
  });
});
