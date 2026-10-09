import { describe, expect, it } from 'vitest'
import { uniqueArrangementSlug } from '@/lib/slug'
describe('uniqueArrangementSlug', () => {
  it('derives from the title and suffixes on collision', async () => {
    const taken = new Set(['pipeline', 'pipeline-2'])
    expect(await uniqueArrangementSlug('Pipeline', async (s) => taken.has(s))).toBe('pipeline-3')
    expect(await uniqueArrangementSlug('Girls on the Beach!', async () => false)).toBe('girls-on-the-beach')
  })
})
