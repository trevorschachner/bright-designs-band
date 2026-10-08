import { describe, it, expect, afterEach, vi } from 'vitest'

const load = async () => {
  vi.resetModules()
  return await import('@/lib/env')
}

const loadServer = async () => {
  vi.resetModules()
  return await import('@/lib/env.server')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('public helpers', () => {
  it('applies defaults when unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_STORAGE_BUCKET', '')
    vi.stubEnv('NEXT_PUBLIC_STORAGE_ROOT_PREFIX', '')
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    const env = await load()
    expect(env.getStorageBucket()).toBe('Bright Designs')
    expect(env.getStorageRootPrefix()).toBe('files')
    expect(env.getPosthogHost()).toBe('/ingest')
    expect(env.getPublicSiteUrl()).toBe('https://www.brightdesigns.band')
    expect(env.getPublicEnv()).toMatchObject({
      NEXT_PUBLIC_STORAGE_BUCKET: 'Bright Designs',
      NEXT_PUBLIC_STORAGE_ROOT_PREFIX: 'files',
      NEXT_PUBLIC_POSTHOG_HOST: '/ingest',
      NEXT_PUBLIC_SITE_URL: null,
    })
  })

  it('treats a Netlify-masked **** value as unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '****')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    vi.stubEnv('NEXT_PUBLIC_STORAGE_BUCKET', '****')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '****')
    const env = await load()
    expect(env.getSupabaseConfig()).toEqual({ url: null, key: 'anon' })
    expect(env.getStorageBucket()).toBe('Bright Designs')
    expect(env.getOptionalPublicSiteUrl()).toBeNull()
  })

  it('sanitises the public site URL', async () => {
    const env = await load()
    expect(env.sanitizePublicUrl('  https://brightdesigns.band  ')).toBe('https://brightdesigns.band')
    expect(env.sanitizePublicUrl('not a url')).toBeNull()
    expect(env.sanitizePublicUrl('****')).toBeNull()
  })

  it('strips slashes from the storage root prefix', async () => {
    vi.stubEnv('NEXT_PUBLIC_STORAGE_ROOT_PREFIX', '/shows/')
    expect((await load()).getStorageRootPrefix()).toBe('shows')
  })

  it('skips Supabase only during a masked Netlify build', async () => {
    vi.stubEnv('NETLIFY', 'true')
    vi.stubEnv('NETLIFY_LOCAL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '****')
    expect((await load()).shouldSkipSupabase()).toBe(true)

    vi.stubEnv('NETLIFY_LOCAL', 'true')
    expect((await load()).shouldSkipSupabase()).toBe(false)

    vi.stubEnv('NETLIFY_LOCAL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon')
    expect((await load()).shouldSkipSupabase()).toBe(false)
  })

  it('falls back to the Turnstile test site key outside production only', async () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect((await load()).getTurnstileSiteKey()).toBe('1x00000000000000000000AA')
    vi.stubEnv('NODE_ENV', 'production')
    expect((await load()).getTurnstileSiteKey()).toBeNull()
  })
})

describe('server env', () => {
  it('defaults EMAIL_SERVICE to resend and treats **** as unset', async () => {
    vi.stubEnv('EMAIL_SERVICE', '')
    vi.stubEnv('RESEND_API_KEY', '****')
    vi.stubEnv('TURNSTILE_SECRET_KEY', '****')
    vi.stubEnv('DATABASE_URL', '****')
    const env = await loadServer()
    const parsed = env.getEnv()
    expect(parsed.EMAIL_SERVICE).toBe('resend')
    expect(parsed.RESEND_API_KEY).toBeUndefined()
    expect(parsed.DATABASE_URL).toBeUndefined()
    expect(env.getTurnstileSecret()).toBeNull()
  })

  it('rejects an unknown EMAIL_SERVICE without echoing it', async () => {
    vi.stubEnv('EMAIL_SERVICE', 'carrier-pigeon')
    const env = await loadServer()
    expect(() => env.getEnv()).toThrow(/EMAIL_SERVICE/)
    expect(() => env.getEnv()).not.toThrow(/carrier-pigeon/)
  })

  it('accepts EMAIL_SERVICE case-insensitively', async () => {
    vi.stubEnv('EMAIL_SERVICE', ' Resend ')
    expect((await loadServer()).getEnv().EMAIL_SERVICE).toBe('resend')
    vi.stubEnv('EMAIL_SERVICE', 'SMTP')
    expect((await loadServer()).getEnv().EMAIL_SERVICE).toBe('smtp')
  })

  it('coerces SMTP_PORT and SMTP_SECURE', async () => {
    vi.stubEnv('SMTP_PORT', '465')
    vi.stubEnv('SMTP_SECURE', 'true')
    const parsed = (await loadServer()).getEnv()
    expect(parsed.SMTP_PORT).toBe(465)
    expect(parsed.SMTP_SECURE).toBe(true)
  })

  it('rejects a non-numeric SMTP_PORT', async () => {
    vi.stubEnv('SMTP_PORT', 'abc')
    const env = await loadServer()
    expect(() => env.getEnv()).toThrow(/SMTP_PORT/)
  })

  it('splits and trims ADMIN_EMAIL_ADDRESSES', async () => {
    vi.stubEnv('ADMIN_EMAIL_ADDRESSES', ' a@x.com , b@y.com,, ')
    expect((await loadServer()).getEnv().ADMIN_EMAIL_ADDRESSES).toEqual(['a@x.com', 'b@y.com'])
  })

  it('accepts postgres and postgresql DATABASE_URLs', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://u:p@db.example.com:5432/app')
    expect((await loadServer()).getEnv().DATABASE_URL).toBe('postgresql://u:p@db.example.com:5432/app')
    vi.stubEnv('DATABASE_URL', 'postgres://u:p@db.example.com/app')
    expect((await loadServer()).getEnv().DATABASE_URL).toBe('postgres://u:p@db.example.com/app')
  })

  it('aggregates invalid keys into one error that never echoes values', async () => {
    vi.stubEnv('DATABASE_URL', 'mysql://admin:hunter2@db.example.com/app')
    vi.stubEnv('SMTP_PORT', 'not-a-port')
    const env = await loadServer()
    let message = ''
    try {
      env.getEnv()
    } catch (error) {
      message = (error as Error).message
    }
    expect(message).toContain('Invalid environment variables')
    expect(message).toContain('DATABASE_URL')
    expect(message).toContain('SMTP_PORT')
    expect(message).not.toContain('hunter2')
    expect(message).not.toContain('mysql')
    expect(message).not.toContain('not-a-port')
  })

  it('parses once and caches', async () => {
    vi.stubEnv('EMAIL_FROM', 'first@x.com')
    const env = await loadServer()
    expect(env.getEnv().EMAIL_FROM).toBe('first@x.com')
    vi.stubEnv('EMAIL_FROM', 'second@x.com')
    expect(env.getEnv().EMAIL_FROM).toBe('first@x.com')
  })
})
