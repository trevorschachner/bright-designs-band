// Structured Data / Schema.org markup for SEO
export interface StructuredDataProps {
  type: 'Organization' | 'Service' | 'CreativeWork' | 'Article' | 'Review' | 'LocalBusiness'
  data: Record<string, unknown>
}

export function generateStructuredData(props: StructuredDataProps): string {
  const baseContext = {
    '@context': 'https://schema.org',
    '@type': props.type,
    ...props.data
  }

  return JSON.stringify(baseContext, null, 2)
}

// Organization Schema for main business
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Bright Designs',
  alternateName: 'Bright Designs Band',
  description: 'Championship-caliber marching band show design with 10+ years experience, 100+ custom shows, and 250+ arrangements delivered. Student-centered design specializing in BOA competitive bands and state finalist programs.',
  url: 'https://www.brightdesigns.band',
  logo: 'https://www.brightdesigns.band/logo.png',
  image: 'https://www.brightdesigns.band/og-image.jpg',
  foundingDate: '2017',
  founders: [
    {
      '@type': 'Person',
      name: 'Brighton Barrineau',
      jobTitle: 'Arranger and Designer'
    },
    {
      '@type': 'Person', 
      name: 'Trevor Schachner',
      jobTitle: 'Arranger and Designer'
    },
    {
      '@type': 'Person',
      name: 'Ryan Wilhite', 
      jobTitle: 'Program Coordinator and Designer'
    }
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'trevorschachner@gmail.com',
    availableLanguage: 'English'
  },
  sameAs: [
    // Add social media profiles when available
  ],
  serviceType: [
    'Marching Band Show Design',
    'Custom Show Design',
    'Professional Music Design & Arrangements',
    'Custom Music Arrangements', 
    'Drill Writing',
    'Visual Design',
    'Program Coordination',
    'Music Design',
    'Band Design',
    'Band Consultation',
    'Band Design Consultation',
    'Band Design Services',
    'Band Choreography',
    'Music Education Services',
    'Band Design and Development',
    'Band Design and Development Services',
    'Band Design and Development Consultation',
  

  ],
  areaServed: {
    '@type': 'Country',
    name: 'United States'
  },
  knowsAbout: [
    'Marching Band',
    'Music Arrangement',
    'Drill Design',
    'Performance Choreography',
    'Competitive Marching Band',
    'Music Education'
  ]
}

// Service Schema for main services
export function createServiceSchema(service: {
  name: string
  description: string
  serviceType: string
  provider?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    serviceType: service.serviceType,
    provider: {
      '@type': 'Organization',
      name: service.provider || 'Bright Designs',
      url: 'https://www.brightdesigns.band'
    },
    areaServed: {
      '@type': 'Country', 
      name: 'United States'
    },
    audience: {
      '@type': 'Audience',
      audienceType: [
        'High School Marching Bands',
        'College Marching Bands', 
        'Competitive Marching Bands',
        'Music Educators',
        'Band Directors'
      ]
    }
  }
}

// Creative Work Schema for shows and arrangements
export function createCreativeWorkSchema(work: {
  name: string
  description: string
  creator: string
  genre?: string
  year?: string
  difficulty?: string
  duration?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: work.name,
    description: work.description,
    creator: {
      '@type': 'Organization',
      name: work.creator
    },
    genre: work.genre || 'Marching Band Music',
    dateCreated: work.year,
    duration: work.duration,
    audience: {
      '@type': 'Audience',
      audienceType: 'Marching Band'
    },
    additionalProperty: work.difficulty ? [
      {
        '@type': 'PropertyValue',
        name: 'Difficulty Level',
        value: work.difficulty
      }
    ] : undefined
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
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.headline,
    description: article.description,
    author: {
      '@type': 'Person',
      name: article.author
    },
    publisher: {
      '@type': 'Organization',
      name: 'Bright Designs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.brightdesigns.band/logo.png'
      }
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    image: article.image ? {
      '@type': 'ImageObject',
      url: article.image
    } : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage'
    }
  }
}

// FAQ Schema for common questions
export function createFAQSchema(faqs: Array<{ question: string, answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

// Breadcrumb Schema
export function createBreadcrumbSchema(breadcrumbs: Array<{ name: string, url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url
    }))
  }
}

// Local Business Schema for regional SEO
export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Bright Designs',
  alternateName: 'Bright Designs Band',
  description: 'Championship-caliber marching band show design with 10+ years experience, 100+ custom shows, 250+ arrangements, and 50+ ensembles served. Student-centered design specializing in BOA competitive bands and state finalist programs across the Southeast.',
  url: 'https://www.brightdesigns.band',
  logo: 'https://www.brightdesigns.band/logo.png',
  image: 'https://www.brightdesigns.band/og-image.jpg',
  serviceArea: [
    {
      '@type': 'State',
      name: 'South Carolina'
    },
    {
      '@type': 'State', 
      name: 'Georgia'
    },
    {
      '@type': 'State',
      name: 'North Carolina'
    },
    {
      '@type': 'State',
      name: 'Florida'
    }
  ],
  areaServed: {
    '@type': 'Country',
    name: 'United States'
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Marching Band Design Services',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Custom Marching Band Show Design',
          description: 'Complete custom show design specifically crafted for BOA regional and national competition success. Includes music arrangements, drill writing, visual design, wind choreography, and guard choreography.'
        }
      },
      {
        '@type': 'Offer', 
        itemOffered: {
          '@type': 'Service',
          name: 'Professional Music Design & Arrangements',
          description: 'Pre-written and custom wind, percussion, and sound design for groups of all skill levels with on-time delivery and clear communication'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Visual Design & Drill Writing',
          description: 'Custom visual design, wind choreography, and guard choreography optimized for BOA competitions and state championship performance'
        }
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Program Coordination',
          description: 'One point of contact for all design needs from day one until the end of the season with professional project management'
        }
      }
    ]
  },
  priceRange: '$2,500 - $10,000+',
  telephone: '+1-XXX-XXX-XXXX', // Update with actual phone
  email: 'trevorschachner@gmail.com',
  knowsAbout: [
    'BOA Marching Band Competition',
    'State Championship Preparation', 
    'Southeast Regional Circuits',
    'Competitive Show Design',
    'Music Education'
  ]
}

// Common schemas for the marching band industry
export const marchingBandSchemas = {
  organization: organizationSchema,
  localBusiness: localBusinessSchema,
  
  showDesignService: createServiceSchema({
    name: 'Custom Marching Band Show Design',
    description: 'Complete custom show design specifically crafted for BOA regional and national competition success. Includes music arrangements, drill writing, visual design, wind choreography, and guard choreography. Student-centered approach with comprehensive support from concept through finals week.',
    serviceType: 'Creative Design Service'
  }),

  arrangementService: createServiceSchema({
    name: 'Professional Music Design & Arrangements',
    description: 'Pre-written and custom wind, percussion, and sound design for groups of all skill levels. Professional music arrangements delivered on time with clear communication and comprehensive support. Over 250 arrangements delivered with proven results.',
    serviceType: 'Music Arrangement Service'
  }),

  drillService: createServiceSchema({
    name: 'Visual Design & Drill Writing',
    description: 'Custom visual design, wind choreography, and guard choreography that makes your band shine. Innovative drill writing optimized for BOA competitions and state championship performance with field designs that captivate audiences and judges.',
    serviceType: 'Choreography Design Service'
  }),
  
  programCoordination: createServiceSchema({
    name: 'Program Coordination',
    description: 'Creative programming, comprehensive design elements, and professional project management. One point of contact for all your needs from day one until the end of the season. Clear communication and on-time delivery guaranteed.',
    serviceType: 'Professional Service'
  })
}