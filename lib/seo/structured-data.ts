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
  description: 'Professional marching band show design, custom arrangements, and drill writing services for competitive and exhibition programs.',
  url: 'https://www.brightdesigns.band',
  logo: 'https://www.brightdesigns.band/logo.png',
  image: 'https://www.brightdesigns.band/og-image.jpg',
  foundingDate: '2020', // Update with actual founding date
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
    'Custom Music Arrangements', 
    'Drill Writing',
    'Band Choreography',
    'Music Education Services'
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

// Common schemas for the marching band industry
export const marchingBandSchemas = {
  organization: organizationSchema,
  
  showDesignService: createServiceSchema({
    name: 'Marching Band Show Design',
    description: 'Complete marching band show design including music arrangements, drill writing, and choreography for competitive and exhibition programs.',
    serviceType: 'Creative Design Service'
  }),

  arrangementService: createServiceSchema({
    name: 'Custom Marching Band Arrangements',
    description: 'Professional music arrangements and orchestrations tailored for marching band ensembles of all skill levels.',
    serviceType: 'Music Arrangement Service'
  }),

  drillService: createServiceSchema({
    name: 'Marching Band Drill Design',
    description: 'Custom drill writing and field choreography design for marching band competitions and performances.',
    serviceType: 'Choreography Design Service'
  })
}