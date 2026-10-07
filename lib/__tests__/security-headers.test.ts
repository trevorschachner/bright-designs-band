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
  });

  it('includes the Supabase origin when a hostname is given and omits it otherwise', () => {
    expect(buildCsp('abc.supabase.co')).toContain('https://abc.supabase.co');
    const csp = buildCsp(null);
    expect(csp).not.toContain('supabase');
    expect(csp).not.toContain('null');
    expect(csp).toContain("media-src 'self';");
  });
});
