import Head from 'next/head'
import { JsonLd } from './JsonLd'
import type { SEOConfig } from '@/lib/seo/metadata'

interface SEOHeadProps {
  config: SEOConfig
  structuredData?: Record<string, unknown>[]
}

export function SEOHead({ config, structuredData = [] }: SEOHeadProps) {
  return (
    <>
      <Head>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        {config.keywords && (
          <meta name="keywords" content={config.keywords.join(', ')} />
        )}
        
        {/* Open Graph */}
        <meta property="og:title" content={config.title} />
        <meta property="og:description" content={config.description} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Bright Designs" />
        {config.ogImage && (
          <>
            <meta property="og:image" content={config.ogImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content={config.title} />
          </>
        )}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={config.title} />
        <meta name="twitter:description" content={config.description} />
        {config.ogImage && (
          <meta name="twitter:image" content={config.ogImage} />
        )}
        
        {/* Additional SEO */}
        <meta name="robots" content={config.noindex ? "noindex,nofollow" : "index,follow"} />
        {config.canonical && <link rel="canonical" href={config.canonical} />}
        
        {/* Marching Band Industry Specific */}
        <meta name="subject" content="Marching Band Show Design" />
        <meta name="topic" content="Music Education, Performance Arts" />
        <meta name="audience" content="Band Directors, Music Educators, Marching Band Students" />
        <meta name="classification" content="Music Education Services" />
        
        {/* Viewport and Basic */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        
        {/* Language and Locale */}
        <meta httpEquiv="Content-Language" content="en-US" />
        <meta property="og:locale" content="en_US" />
      </Head>
      
      {/* Structured Data */}
      {structuredData.map((data, index) => (
        <JsonLd key={index} data={data} />
      ))}
    </>
  )
}

export default SEOHead