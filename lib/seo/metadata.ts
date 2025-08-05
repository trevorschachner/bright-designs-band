import { Metadata } from 'next'

export interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  structuredData?: Record<string, unknown>
  canonical?: string
  noindex?: boolean
}

export const defaultSEOConfig: SEOConfig = {
  title: "Bright Designs - Custom Marching Band Show Design & Arrangements",
  description: "Professional marching band show design, custom arrangements, and drill writing services. Create captivating performances that elevate your band's artistry and competitive edge.",
  keywords: [
    "marching band design",
    "custom marching band shows", 
    "marching band arrangements",
    "drill design",
    "marching band choreography",
    "band show design",
    "competitive marching band",
    "marching band music",
    "custom drill writing",
    "marching band services"
  ],
  ogImage: "/og-image.jpg"
}

export function generateMetadata(seoConfig: Partial<SEOConfig> = {}): Metadata {
  const config = { ...defaultSEOConfig, ...seoConfig }
  
  const metadata: Metadata = {
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
    description: "Award-winning marching band show design services. Custom arrangements, innovative drill design, and complete show packages that captivate audiences and elevate performances.",
    keywords: [
      "marching band design",
      "custom marching band shows",
      "marching band arrangements", 
      "drill design services",
      "competitive marching band design",
      "band show choreography",
      "marching band music arrangements",
      "custom drill writing",
      "marching band consulting",
      "show design services"
    ]
  },
  
  arrangements: {
    title: "Custom Marching Band Arrangements - Professional Music Design",
    description: "Professional marching band arrangements tailored to your ensemble. Custom orchestrations, difficulty levels, and performance requirements for competitive and exhibition programs.",
    keywords: [
      "marching band arrangements",
      "custom band music",
      "marching band orchestration",
      "competitive band arrangements",
      "marching band transcriptions",
      "custom wind ensemble music",
      "band arrangement services",
      "marching band scoring"
    ]
  },
  
  shows: {
    title: "Marching Band Show Catalog - Custom Performance Designs",
    description: "Browse our catalog of original marching band shows and custom designs. Complete packages including music, drill, and choreography for all skill levels.",
    keywords: [
      "marching band shows",
      "custom show design",
      "marching band repertoire",
      "competitive show programs",
      "marching band catalog",
      "drill and music packages",
      "band performance programs"
    ]
  },

  about: {
    title: "About Bright Designs - Expert Marching Band Designers",
    description: "Meet the team behind Bright Designs. Experienced arrangers, drill writers, and show designers creating innovative marching band programs since [year].",
    keywords: [
      "marching band designers",
      "drill writers",
      "band arrangers",
      "show design team",
      "marching band consultants"
    ]
  },

  contact: {
    title: "Contact Bright Designs - Marching Band Design Services",
    description: "Ready to create your next show? Contact Bright Designs for custom marching band arrangements, drill design, and complete show packages.",
    keywords: [
      "marching band design contact",
      "custom arrangement inquiry",
      "drill design services",
      "band show consultation"
    ]
  }
} as const