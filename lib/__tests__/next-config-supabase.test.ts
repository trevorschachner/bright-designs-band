import { describe, it, expect, vi, afterEach } from 'vitest';

async function loadConfig() {
  vi.resetModules();
  return (await import('../../next.config.mjs')).default;
}

describe('next.config Supabase hostname', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('throws in a Netlify production build when the URL is missing', async () => {
    vi.stubEnv('CONTEXT', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    await expect(loadConfig()).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('throws in production when the URL is masked', async () => {
    vi.stubEnv('CONTEXT', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '****');
    await expect(loadConfig()).rejects.toThrow(/production build/);
  });

  it('warns and yields no image patterns in a deploy preview when the URL is missing', async () => {
    vi.stubEnv('CONTEXT', 'deploy-preview');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = await loadConfig();
    expect(warn).toHaveBeenCalledOnce();
    expect(config.images?.remotePatterns).toEqual([]);
  });

  it('allows the Supabase storage host when the URL is present', async () => {
    vi.stubEnv('CONTEXT', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://abc.supabase.co');
    const config = await loadConfig();
    expect(config.images?.remotePatterns).toEqual([
      { protocol: 'https', hostname: 'abc.supabase.co', pathname: '/storage/v1/object/public/**' },
    ]);
  });
});
