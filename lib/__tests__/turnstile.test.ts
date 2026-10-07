import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const fetchMock = vi.fn()

const load = async () => {
  vi.resetModules()
  return (await import('@/lib/turnstile')).verifyTurnstile
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret-abc')
  vi.stubEnv('NODE_ENV', 'test')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

describe('verifyTurnstile', () => {
  it('posts secret, response and remoteip to siteverify and accepts success', async () => {
    fetchMock.mockResolvedValue(ok({ success: true }))
    const verify = await load()
    expect(await verify('tok', '203.0.113.9')).toBe(true)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(init.method).toBe('POST')
    const form = init.body as FormData
    expect(form.get('secret')).toBe('secret-abc')
    expect(form.get('response')).toBe('tok')
    expect(form.get('remoteip')).toBe('203.0.113.9')
  })

  it('rejects when Cloudflare says no', async () => {
    fetchMock.mockResolvedValue(ok({ success: false, 'error-codes': ['invalid-input-response'] }))
    expect(await (await load())('tok')).toBe(false)
  })

  it('rejects on a non-2xx response or a network error', async () => {
    const verify = await load()
    fetchMock.mockResolvedValueOnce(new Response('oops', { status: 500 }))
    expect(await verify('tok')).toBe(false)
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    expect(await verify('tok')).toBe(false)
  })

  it('rejects when siteverify does not answer within 5 seconds', async () => {
    vi.useFakeTimers()
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
        })
    )
    const verify = await load()
    const pending = verify('tok')
    await vi.advanceTimersByTimeAsync(5000)
    expect(await pending).toBe(false)
  })

  it('rejects an empty token without calling Cloudflare', async () => {
    expect(await (await load())('')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips verification in development when no secret is configured', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NODE_ENV', 'development')
    expect(await (await load())('anything')).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects everything in production when no secret is configured, logging once', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('TURNSTILE_SECRET_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')
    const verify = await load()
    expect(await verify('tok')).toBe(false)
    expect(await verify('tok')).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })
})
