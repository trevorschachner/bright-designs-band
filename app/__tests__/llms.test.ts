import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ShowIndexEntry } from '@/lib/services/shows'

const SHOWS: ShowIndexEntry[] = [
  { slug: 'true-north', title: 'True North', description: 'A journey north. Second sentence.', year: 2025, difficulty: 'Advanced' },
  { slug: 'paper-cities', title: 'Paper Cities', description: 'Costs $5,000 to stage.', year: 2024, difficulty: 'Intermediate' },
  { slug: 'quiet', title: 'Quiet', description: null, year: null, difficulty: null },
]

vi.mock('@/lib/services/shows', () => ({
  getShowIndex: vi.fn(async () => SHOWS),
}))

import { GET as getLlms } from '../llms.txt/route'
import { GET as getLlmsFull } from '../llms-full.txt/route'
import { FAQS } from '@/lib/content/faqs'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://brightdesigns.band')
})

describe('/llms.txt', () => {
  it('lists every show, never a price, and says pricing is quoted', async () => {
    const res = await getLlms()
    const body = await res.text()
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8')
    expect(res.headers.get('cache-control')).toBe('public, s-maxage=3600')
    expect(body).not.toContain('$')
    for (const show of SHOWS) expect(body).toContain(show.title)
    expect(body).toContain('quoted per program')
    expect(body).toContain('- [True North](https://brightdesigns.band/shows/true-north) — 2025, Advanced, A journey north.')
    expect(body).toContain('/collections/competitive-marching-band-shows')
  })
})

describe('/llms-full.txt', () => {
  it('adds full descriptions and the FAQ text, still without a price', async () => {
    const body = await (await getLlmsFull()).text()
    expect(body).not.toContain('$')
    for (const show of SHOWS) expect(body).toContain(show.title)
    expect(body).toContain('Second sentence.')
    expect(body).toContain('quoted per program')
    for (const faq of FAQS) expect(body).toContain(faq.question)
  })
})
