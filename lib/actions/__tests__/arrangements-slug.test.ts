import { describe, expect, it } from 'vitest'
import { uniqueArrangementSlug } from '@/lib/slug'
describe('uniqueArrangementSlug', () => {
  it('derives from the title and suffixes on collision', async () => {
    const taken = new Set(['pipeline', 'pipeline-2'])
    expect(await uniqueArrangementSlug('Pipeline', async (s) => taken.has(s))).toBe('pipeline-3')
    expect(await uniqueArrangementSlug('Girls on the Beach!', async () => false)).toBe('girls-on-the-beach')
  })
  it('never yields an empty or all-digit slug', async () => {
    expect(await uniqueArrangementSlug('1999', async () => false)).toBe('arrangement-1999')
    expect(await uniqueArrangementSlug('???', async () => false)).toBe('arrangement')
  })
  it('terminates when every candidate is taken', async () => {
    const slug = await uniqueArrangementSlug('Pipeline', async () => true)
    expect(slug).toMatch(/^pipeline-\d+$/)
  })
})
