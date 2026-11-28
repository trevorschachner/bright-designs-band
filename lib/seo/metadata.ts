import { Metadata } from 'next'
import { getOptionalPublicSiteUrl, sanitizePublicUrl } from '@/lib/env'
import type { CatalogFilters } from '@/lib/filters/catalog-params'

export interface SEOConfig {
  title: string
  description: string
  keywords?: readonly string[]
  ogImage?: string
  structuredData?: Record<string, unknown>
  canonical?: string
  /** Site-relative path of this page ('/faqs'). Builds the canonical on the public origin. */
  path?: string
  noindex?: boolean
}

export const defaultSEOConfig: SEOConfig = {
  title: "Marching Band Show Design: Custom Shows and Shows for Sale | Bright Designs",
  description: "Custom marching band shows, pre-written shows for sale, arrangements, drill and program coordination from a South Carolina design team.",
  keywords: [
    "marching band shows",
    "marching band show design",
    "custom marching band show",
    "marching band shows for sale",
    "marching band arrangements",
    "marching band drill design"
  ]
}

export function canonicalFor(path: string): string {
  const origin = (getOptionalPublicSiteUrl() || 'https://brightdesigns.band').replace(/\/+$/, '')
  const clean = path === '/' ? '' : '/' + path.replace(/^\/+/, '').replace(/\/+$/, '')
  return origin + clean
}

/**
 * Canonical for a catalog URL (`/shows?…`, `/arrangements?…`). A later page of
 * the unfiltered catalog is its own canonical: pointing it at page 1 marks it
 * as a duplicate, and the items only linked from it stop being discovered
 * through it. Filtered, searched, sorted and resized views are variants of the
 * catalog and keep the bare path.
 */
export function catalogCanonical(basePath: string, filters: CatalogFilters, defaultLimit: number): string {
  const plain =
    !filters.search &&
    !filters.featured &&
    filters.conditions.length === 0 &&
    filters.sort.length === 0 &&
    filters.limit === defaultLimit
  return canonicalFor(plain && filters.page > 1 ? `${basePath}?page=${filters.page}` : basePath)
}

export function generateMetadata(seoConfig: Partial<SEOConfig> = {}): Metadata {
  const config = { ...defaultSEOConfig, ...seoConfig }
  
  // Set metadataBase to resolve social open graph and twitter images
  const siteUrl = getOptionalPublicSiteUrl()
  const canonical = sanitizePublicUrl(config.canonical) ?? (config.path ? canonicalFor(config.path) : undefined)
  // Origin only. Next resolves a route's opengraph-image against metadataBase,
  // so a base that carried the page path doubled it
  // (/about/about/opengraph-image) and every social image 404ed.
  const baseUrl = new URL(siteUrl || canonical || 'https://brightdesigns.band').origin
  
  const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: config.title,
    description: config.description,
    keywords: config.keywords?.join(', '),
    authors: [{ name: "Bright Designs" }],
    creator: "Bright Designs",
    publisher: "Bright Designs",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    robots: {
      index: !config.noindex,
      follow: true,
      googleBot: {
        index: !config.noindex,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      siteName: 'Bright Designs',
      title: config.title,
      description: config.description,
      // Only set `images` when we have one. Next skips a route's
      // opengraph-image.tsx whenever this key exists, even as `undefined`.
      ...(config.ogImage && {
        images: [
          {
            url: config.ogImage,
            width: 1200,
            height: 630,
            alt: config.title,
          }
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      ...(config.ogImage && { images: [config.ogImage] }),
    },
    alternates: canonical ? { canonical } : undefined,
  }

  return metadata
}
