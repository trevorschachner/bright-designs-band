/**
 * Schema.org JSON-LD builders. Rendered by components/features/seo/JsonLd.tsx.
 *
 * Business rule: every show and arrangement is for sale, but pricing is quoted
 * per program. No schema here ever publishes a price, price range or currency.
 */

import { getPublicSiteUrl } from '@/lib/env'
import { socialProfileUrls } from './social'
import type { Faq } from '@/lib/content/faqs'
import type { PublicPiece } from '@/lib/pieces/credits'

type Schema = Record<string, unknown>

/** The site origin (no trailing slash), from NEXT_PUBLIC_SITE_URL. */
export function siteUrl(): string {
  return getPublicSiteUrl().replace(/\/+$/, '')
}

/** A site path (or an absolute URL) to an absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  return `${siteUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

const ORGANIZATION_NAME = 'Bright Designs'
const CONTACT_EMAIL = 'hello@brightdesigns.band'

/** Stable node id, so other schemas can point at the Organization. */
export const organizationId = () => `${siteUrl()}/#organization`

/** A reference to the Organization node, for brand / creator / publisher. */
export const organizationRef = (): Schema => ({
  '@type': 'Organization',
  '@id': organizationId(),
  name: ORGANIZATION_NAME,
  url: siteUrl(),
})

export const FOUNDERS = [
  { name: 'Trevor Schachner', jobTitle: 'Music and Visual Designer' },
  { name: 'Brighton Barrineau', jobTitle: 'Music and Visual Designer' },
  { name: 'Ryan Wilhite', jobTitle: 'Program Coordinator' },
] as const

const AREA_SERVED: Schema[] = [
  { '@type': 'State', name: 'South Carolina' },
  { '@type': 'State', name: 'Georgia' },
  { '@type': 'State', name: 'North Carolina' },
  { '@type': 'State', name: 'Florida' },
  { '@type': 'Country', name: 'United States' },
]

/**
 * The Organization. `sameAs` lists only the profiles filled in
 * lib/seo/social.ts; it is left out entirely while none are.
 */
export function createOrganizationSchema(profiles?: Record<string, string>): Schema {
  const sameAs = socialProfileUrls(profiles)
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId(),
    name: ORGANIZATION_NAME,
    legalName: ORGANIZATION_NAME,
    alternateName: 'Bright Designs Band',
    description: 'Marching band show design: music, drill, choreography and program coordination. Every show and arrangement in the catalog is for sale, with pricing quoted per program. Based in South Carolina, serving the Southeast (SC, GA, NC, FL) and bands nationally.',
    url: siteUrl(),
    logo: absoluteUrl('/logos/brightdesignslogo-main.png'),
    foundingDate: '2017',
    founder: FOUNDERS.map((f) => ({ '@type': 'Person', name: f.name, jobTitle: f.jobTitle })),
    email: CONTACT_EMAIL,
    address: { '@type': 'PostalAddress', addressRegion: 'SC', addressCountry: 'US' },
    areaServed: AREA_SERVED,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: CONTACT_EMAIL,
      availableLanguage: 'English',
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    knowsAbout: [
      'Marching Band',
      'Marching Band Show Design',
      'Music Arrangement',
      'Drill Design',
      'Performance Choreography',
      'Competitive Marching Band',
      'Music Education',
    ],
  }
}

export const organizationSchema = createOrganizationSchema()

// Service Schema for main services
export function createServiceSchema(service: {
  name: string
  description: string
  serviceType: string
}): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    serviceType: service.serviceType,
    provider: organizationRef(),
    areaServed: AREA_SERVED,
    audience: {
      '@type': 'Audience',
      audienceType: [
        'High School Marching Bands',
        'College Marching Bands',
        'Competitive Marching Bands',
        'Music Educators',
        'Band Directors',
      ],
    },
  }
}

// Article Schema for blog posts
export function createArticleSchema(article: {
  headline: string
  description: string
  author: string
  datePublished: string
  dateModified?: string
  image?: string
}): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    author: article.author === ORGANIZATION_NAME ? organizationRef() : { '@type': 'Person', name: article.author },
    publisher: {
      ...organizationRef(),
      logo: { '@type': 'ImageObject', url: absoluteUrl('/logos/brightdesignslogo-main.png') },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    ...(article.image ? { image: { '@type': 'ImageObject', url: absoluteUrl(article.image) } } : {}),
  }
}

/** FAQPage from the same `Faq[]` the page renders (lib/content/faqs.ts). */
export function createFAQSchema(faqs: Faq[]): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

/** CollectionPage whose mainEntity is the ItemList of shows on the page. */
export function createCollectionPageSchema(input: {
  name: string
  description: string
  url: string
  items: Array<{ name: string; url: string }>
}): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.url),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: input.items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.url),
      })),
    },
  }
}

/** BreadcrumbList. Paths become absolute URLs (Google requires them). */
export function createBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): Schema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: absoluteUrl(breadcrumb.url),
    })),
  }
}

/** Unique source pieces (title + composer), in first-seen order. */
function basedOn(pieces: PublicPiece[] | undefined): Schema[] {
  const seen = new Set<string>()
  const out: Schema[] = []
  for (const piece of pieces ?? []) {
    const title = piece.title?.trim()
    if (!title) continue
    const composer = piece.composer?.trim() || null
    const key = `${title.toLowerCase()}|${(composer ?? '').toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      '@type': 'MusicComposition',
      name: title,
      ...(composer ? { composer: { '@type': 'Person', name: composer } } : {}),
    })
  }
  return out
}

/**
 * MusicComposition for a show or an arrangement. `isBasedOn` lists the source
 * pieces (title + composer) the page already loads.
 */
export function createMusicCompositionSchema({
  name,
  description,
  url,
  composer,
  year,
  pieces,
  partOf,
  duration,
  educationalLevel,
  inStock,
}: {
  name: string
  description?: string | null
  url: string
  /** ISO 8601 duration, e.g. PT7M30S. */
  duration?: string | null
  educationalLevel?: string | null
  /** Emits a price-less Offer; we never publish prices. */
  inStock?: boolean
  /** The arrangement's composer credit; shows leave it out. */
  composer?: string | null
  year?: number | string | null
  pieces?: PublicPiece[]
  /** The show an arrangement belongs to. */
  partOf?: { name: string; url: string } | null
}): Schema {
  const sources = basedOn(pieces)
  const composerName = composer?.trim()
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    name,
    ...(description ? { description } : {}),
    url: absoluteUrl(url),
    genre: 'Marching Band',
    creator: organizationRef(),
    ...(composerName ? { composer: { '@type': 'Person', name: composerName } } : {}),
    ...(year ? { dateCreated: String(year) } : {}),
    ...(duration ? { duration } : {}),
    ...(educationalLevel ? { educationalLevel } : {}),
    ...(inStock ? { offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', url: absoluteUrl(url), seller: organizationRef() } } : {}),
    ...(sources.length > 0 ? { isBasedOn: sources } : {}),
    ...(partOf ? { isPartOf: { '@type': 'MusicComposition', name: partOf.name, url: absoluteUrl(partOf.url) } } : {}),
  }
}

/** The 11-character video id from any common YouTube URL form, or null. */
export function youtubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return match?.[1] ?? null
}

/**
 * VideoObject for a show's YouTube performance. Null when there is no URL or
 * no video id can be read from it: the schema needs a real thumbnail and embed.
 */
export function createVideoObjectSchema({
  name,
  description,
  youtubeUrl,
  uploadDate,
}: {
  name: string
  description?: string | null
  youtubeUrl: string | null | undefined
  uploadDate?: string | null
}): Schema | null {
  const videoId = youtubeVideoId(youtubeUrl)
  if (!videoId) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description: description || `Marching band show performance: ${name}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
    ...(uploadDate ? { uploadDate } : {}),
    publisher: organizationRef(),
  }
}

/** A show's VideoObject uploadDate: its createdAt, else Jan 1 of its year. */
export function showUploadDate(createdAt: string | null | undefined, year: number | null | undefined): string | null {
  if (createdAt) return createdAt
  return year ? `${year}-01-01` : null
}

// Local business schema for regional SEO. No priceRange: pricing is quoted per program.
export const localBusinessSchema: Schema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': `${siteUrl()}/#business`,
  name: ORGANIZATION_NAME,
  alternateName: 'Bright Designs Band',
  description: 'Marching band show design for competitive programs across the Southeast and nationally: music, drill, choreography and program coordination.',
  url: siteUrl(),
  logo: absoluteUrl('/logos/brightdesignslogo-main.png'),
  image: absoluteUrl('/logos/brightdesignslogo-main.png'),
  email: CONTACT_EMAIL,
  address: { '@type': 'PostalAddress', addressRegion: 'SC', addressCountry: 'US' },
  areaServed: AREA_SERVED,
  parentOrganization: organizationRef(),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Marching Band Design Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Custom Marching Band Show Design',
          description: 'Complete custom show design: music arrangements, drill writing, visual design, wind choreography, and guard choreography.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Professional Music Design & Arrangements',
          description: 'Pre-written and custom wind, percussion, and sound design for groups of all skill levels.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Visual Design & Drill Writing',
          description: 'Custom visual design, wind choreography, and guard choreography.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Program Coordination',
          description: 'One point of contact for all design needs from day one until the end of the season.',
        },
      },
    ],
  },
  knowsAbout: [
    'BOA Marching Band Competition',
    'State Championship Preparation',
    'Southeast Regional Circuits',
    'Competitive Show Design',
    'Music Education',
  ],
}

// Common schemas for the marching band industry
export const marchingBandSchemas = {
  organization: organizationSchema,
  localBusiness: localBusinessSchema,

  showDesignService: createServiceSchema({
    name: 'Custom Marching Band Show Design',
    description: 'Complete custom show design specifically crafted for BOA regional and national competition success. Includes music arrangements, drill writing, visual design, wind choreography, and guard choreography. Student-centered approach with comprehensive support from concept through finals week.',
    serviceType: 'Creative Design Service',
  }),

  arrangementService: createServiceSchema({
    name: 'Professional Music Design & Arrangements',
    description: 'Pre-written and custom wind, percussion, and sound design for groups of all skill levels. Professional music arrangements delivered on time with clear communication and comprehensive support. Over 250 arrangements delivered with proven results.',
    serviceType: 'Music Arrangement Service',
  }),

  drillService: createServiceSchema({
    name: 'Visual Design & Drill Writing',
    description: 'Custom visual design, wind choreography, and guard choreography that makes your band shine. Innovative drill writing optimized for BOA competitions and state championship performance with field designs that captivate audiences and judges.',
    serviceType: 'Choreography Design Service',
  }),

  programCoordination: createServiceSchema({
    name: 'Program Coordination',
    description: 'Creative programming, comprehensive design elements, and professional project management. One point of contact for all your needs from day one until the end of the season. Clear communication and on-time delivery guaranteed.',
    serviceType: 'Professional Service',
  }),
}
