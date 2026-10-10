import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

describe('proxy collection redirect', () => {
  it('308s the old small-band collection slug to the new one', async () => {
    const res = await proxy(new NextRequest('https://brightdesigns.band/collections/small-band-marching-shows'))
    expect(res.status).toBe(308)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/collections/small-band-marching-band-shows')
  })
})
