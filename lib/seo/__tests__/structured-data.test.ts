import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  createBreadcrumbSchema,
  createFAQSchema,
  createMusicCompositionSchema,
  createOrganizationSchema,
  createVideoObjectSchema,
  showUploadDate,
  youtubeVideoId,
} from '../structured-data'
import { FAQS, FAQ_SECTIONS } from '@/lib/content/faqs'
import { JsonLd, serializeJsonLd } from '@/components/features/seo/JsonLd'

/** Every key anywhere in a JSON value. */
function allKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(allKeys)
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => [k, ...allKeys(v)])
  }
  return []
}

describe('createFAQSchema', () => {
  it('builds FAQPage from the same array /faqs renders', () => {
    const schema = createFAQSchema(FAQS) as { '@type': string; mainEntity: { name: string; acceptedAnswer: { text: string } }[] }
    expect(schema['@type']).toBe('FAQPage')
    expect(schema.mainEntity).toHaveLength(FAQ_SECTIONS.flatMap((s) => s.items).length)
    expect(schema.mainEntity).toHaveLength(15)
    expect(schema.mainEntity[0]).toMatchObject({
      '@type': 'Question',
      name: FAQS[0].question,
      acceptedAnswer: { '@type': 'Answer', text: FAQS[0].answer },
    })
  })
})

describe('createOrganizationSchema', () => {
  it('names the three founders with their job titles', () => {
    const schema = createOrganizationSchema() as { founder: { '@type': string; name: string; jobTitle: string }[] }
    expect(schema.founder).toHaveLength(3)
    expect(schema.founder.every((p) => p['@type'] === 'Person' && p.jobTitle)).toBe(true)
    expect(schema.founder.map((p) => p.name)).toEqual(['Trevor Schachner', 'Brighton Barrineau', 'Ryan Wilhite'])
    expect(schema.founder.find((p) => p.name === 'Ryan Wilhite')?.jobTitle).toBe('Program Coordinator')
  })

  it('carries the business facts', () => {
    expect(createOrganizationSchema()).toMatchObject({
      name: 'Bright Designs',
      foundingDate: '2017',
      email: 'hello@brightdesigns.band',
      address: { addressRegion: 'SC', addressCountry: 'US' },
    })
  })

  it('omits sameAs while every profile is empty', () => {
    expect(createOrganizationSchema({ youtube: '', instagram: '', facebook: '', linkedin: '' })).not.toHaveProperty('sameAs')
  })

  it('lists only the filled profiles in sameAs', () => {
    const schema = createOrganizationSchema({ youtube: 'https://youtube.com/@bd', instagram: '', facebook: ' ', linkedin: '' })
    expect(schema.sameAs).toEqual(['https://youtube.com/@bd'])
  })
})

// No Product schema: Google requires Offer.price for one, and no price is
// ever published. Show pages carry BreadcrumbList, MusicComposition and
// VideoObject only.
describe('no Product schema', () => {
  it('is not exported', async () => {
    const mod = await import('../structured-data')
    expect(mod).not.toHaveProperty('createProductSchema')
  })
})

describe('createVideoObjectSchema', () => {
  it('is null without a YouTube URL', () => {
    expect(createVideoObjectSchema({ name: 'X', youtubeUrl: null })).toBeNull()
    expect(createVideoObjectSchema({ name: 'X', youtubeUrl: '' })).toBeNull()
    expect(createVideoObjectSchema({ name: 'X', youtubeUrl: 'https://example.com/video' })).toBeNull()
  })

  it('builds thumbnail and embed URLs from the video id', () => {
    const schema = createVideoObjectSchema({
      name: 'True North',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10',
      uploadDate: showUploadDate(null, 2024),
    })
    expect(schema).toMatchObject({
      '@type': 'VideoObject',
      name: 'True North',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      uploadDate: '2024-01-01',
    })
  })

  it('reads ids from short, embed and shorts URLs', () => {
    expect(youtubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('prefers createdAt for the upload date', () => {
    expect(showUploadDate('2025-03-01T00:00:00.000Z', 2024)).toBe('2025-03-01T00:00:00.000Z')
  })
})

describe('createMusicCompositionSchema', () => {
  it('lists unique source pieces as isBasedOn', () => {
    const schema = createMusicCompositionSchema({
      name: 'Show',
      url: '/shows/show',
      pieces: [
        { title: 'Bolero', composer: 'Maurice Ravel' },
        { title: 'Bolero', composer: 'Maurice Ravel' },
        { title: 'Original', composer: null },
      ],
    })
    expect(schema.isBasedOn).toEqual([
      { '@type': 'MusicComposition', name: 'Bolero', composer: { '@type': 'Person', name: 'Maurice Ravel' } },
      { '@type': 'MusicComposition', name: 'Original' },
    ])
  })

  it('omits isBasedOn and composer when unknown', () => {
    const schema = createMusicCompositionSchema({ name: 'Part', url: '/arrangements/1', composer: null })
    expect(schema).not.toHaveProperty('isBasedOn')
    expect(schema).not.toHaveProperty('composer')
  })
})

describe('createBreadcrumbSchema', () => {
  it('makes every item URL absolute', () => {
    const schema = createBreadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Shows', url: '/shows' }]) as {
      itemListElement: { position: number; item: string }[]
    }
    expect(schema.itemListElement.map((i) => i.position)).toEqual([1, 2])
    expect(schema.itemListElement.every((i) => /^https?:\/\//.test(i.item))).toBe(true)
  })
})

describe('JsonLd', () => {
  const hostile = { '@type': 'Thing', name: '</script><script>alert(1)</script>' }

  it('escapes < so content cannot close the script tag', () => {
    const json = serializeJsonLd(hostile)
    expect(json).not.toContain('<')
    expect(JSON.parse(json).name).toBe(hostile.name)
  })

  it('server-renders one ld+json script per schema, with no </script> breakout', () => {
    const html = renderToStaticMarkup(createElement(JsonLd, { data: [hostile, { '@type': 'Other' }] }))
    expect(html.match(/<script type="application\/ld\+json">/g)).toHaveLength(2)
    expect(html.match(/<\/script>/g)).toHaveLength(2)
    expect(html).toContain('\\u003c/script>')
  })
})

describe('createMusicCompositionSchema (show fields)', () => {
  it('adds ISO duration, level and a price-less offer', () => {
    const s = createMusicCompositionSchema({ name: 'Apex', url: '/shows/apex', duration: 'PT7M30S', educationalLevel: 'Intermediate', inStock: true }) as any
    expect(s.duration).toBe('PT7M30S')
    expect(s.educationalLevel).toBe('Intermediate')
    expect(s.offers).toEqual({ '@type': 'Offer', availability: 'https://schema.org/InStock', url: 'https://brightdesigns.band/shows/apex', seller: expect.objectContaining({ '@type': 'Organization' }) })
    expect(JSON.stringify(s)).not.toMatch(/price/i)
  })
  it('omits duration and level when null', () => {
    const s = createMusicCompositionSchema({ name: 'Apex', url: '/shows/apex', duration: null, educationalLevel: null }) as any
    expect(s).not.toHaveProperty('duration')
    expect(s).not.toHaveProperty('educationalLevel')
    expect(s).not.toHaveProperty('offers')
  })
})
