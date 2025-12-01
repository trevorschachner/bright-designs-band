import { Metadata } from 'next'
import { getOptionalPublicSiteUrl, sanitizePublicUrl } from '@/lib/env'

export interface SEOConfig {
  title: string
  description: string
  keywords?: readonly string[]
  ogImage?: string
  structuredData?: Record<string, unknown>
  canonical?: string
  noindex?: boolean
}

export const defaultSEOConfig: SEOConfig = {
  title: "Bright Designs - Custom Marching Band Show Design & Arrangements",
  description: "Championship-caliber marching band show design with 10+ years experience and 100+ custom shows delivered. Professional music arrangements, drill design, and visual choreography for competitive bands. Student-centered design that captivates audiences and judges.",
  keywords: [
    "marching band design",
    "custom marching band shows", 
    "marching band arrangements",
    "drill design",
    "visual design choreography",
    "marching band choreography",
    "band show design",
    "competitive marching band",
    "BOA marching band",
    "marching band music",
    "custom drill writing",
    "marching band services",
    "student centered design"
  ],
  ogImage: "/og-image.jpg"
}

export function generateMetadata(seoConfig: Partial<SEOConfig> = {}): Metadata {
  const config = { ...defaultSEOConfig, ...seoConfig }
  
  // Set metadataBase to resolve social open graph and twitter images
  const siteUrl = getOptionalPublicSiteUrl()
  const canonical = sanitizePublicUrl(config.canonical)
  const baseUrl = siteUrl || canonical || 'https://www.brightdesigns.band'
  
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
      images: config.ogImage ? [
        {
          url: config.ogImage,
          width: 1200,
          height: 630,
          alt: config.title,
        }
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: config.ogImage ? [config.ogImage] : undefined,
    },
    alternates: {
      canonical: config.canonical,
    },
  }

  return metadata
}

// Page-specific SEO configurations
export const pageSEOConfigs = {
  home: {
    title: "Bright Designs - Premier Marching Band Show Design & Custom Arrangements",
    description: "Championship-caliber marching band show design with 10+ years experience, 100+ custom shows, and 250+ arrangements delivered. Expert music design, innovative drill, and visual choreography for BOA competitive bands and state finalists. Student-centered design that captivates audiences and elevates scores.",
    keywords: [
      "marching band design",
      "custom marching band shows",
      "BOA marching band design",
      "competitive marching band shows",
      "state finalist band design",
      "marching band arrangements", 
      "drill design services",
      "visual design choreography",
      "wind choreography",
      "guard choreography",
      "music design marching band",
      "percussion design",
      "sound design marching band",
      "program coordination",
      "marching band design without communication issues",
      "reliable show design services",
      "3A 4A marching band shows",
      "Southeast marching band design",
      "custom drill writing",
      "marching band consulting",
      "show design services",
      "BOA regional competition",
      "BOA national competition",
      "student centered band design"
    ]
  },
  
  arrangements: {
    title: "Custom Marching Band Arrangements - Professional Music Design | Bright Designs",
    description: "Professional marching band arrangements delivered on time. Custom orchestrations tailored for competitive bands, BOA regional preparation, and state finals. No communication issues, guaranteed delivery schedule.",
    keywords: [
      "marching band arrangements",
      "custom band music",
      "BOA regional arrangements",
      "competitive band arrangements",
      "marching band orchestration",
      "reliable music delivery",
      "marching band design on time",
      "state finalist arrangements",
      "Southeast band arrangements",
      "custom wind ensemble music",
      "professional band arrangement services",
      "marching band scoring"
    ]
  },
  
  shows: {
    title: "Marching Band Show Catalog - Custom Performance Designs | Bright Designs",
    description: "Browse our catalog of award-winning marching band shows. Complete packages for BOA competition, state finals preparation, and regional circuits. Trusted by competitive bands across the Southeast.",
    keywords: [
      "marching band shows",
      "BOA marching band shows",
      "competitive show programs",
      "state finals preparation shows",
      "custom show design",
      "marching band catalog",
      "drill and music packages",
      "Southeast marching band shows",
      "3A 4A band programs",
      "regional competition shows",
      "marching band repertoire"
    ]
  },

  about: {
    title: "About Bright Designs - Expert Marching Band Designers Serving Southeast BOA Bands",
    description: "Meet the expert team behind Bright Designs. 25+ years of experience creating innovative marching band programs for state finalists, BOA competitive bands, and championship-level ensembles.",
    keywords: [
      "marching band designers",
      "BOA marching band experts",
      "Southeast band designers",
      "drill writers",
      "band arrangers",
      "competitive show design team",
      "state finalist designers",
      "marching band consultants",
      "professional band staff"
    ]
  },

  contact: {
    title: "Contact Bright Designs - Professional Marching Band Design Services",
    description: "Ready to elevate your competitive success? Contact Bright Designs for custom marching band shows, reliable arrangements with on-time delivery, and comprehensive design packages for BOA and state competition.",
    keywords: [
      "marching band design contact",
      "BOA band design inquiry",
      "custom arrangement consultation",
      "competitive show design services",
      "reliable marching band designers",
      "Southeast band design contact",
      "state finals preparation inquiry"
    ]
  },

  // New pages targeting specific customer segments
  build: {
    title: "Build Your Custom Marching Band Show - Professional Design Services",
    description: "Start building your championship-level marching band show. Professional design packages from Spark to Shine tier, delivered on time with comprehensive support for BOA and state competition.",
    keywords: [
      "build custom marching band show",
      "marching band design packages",
      "BOA show design services",
      "competitive band show builder",
      "custom show consultation",
      "marching band design tiers"
    ]
  },

  services: {
    title: "Professional Marching Band Services - Design, Arrangements & Consultation",
    description: "Complete marching band services including custom show design, professional arrangements, drill writing, and consultation. Serving state finalists and BOA competitive bands with reliable, on-time delivery.",
    keywords: [
      "marching band services",
      "professional show design",
      "marching band consultation",
      "competitive band services",
      "BOA preparation services",
      "state finals coaching"
    ]
  }
} as const