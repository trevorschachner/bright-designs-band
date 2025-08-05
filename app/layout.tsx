import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { MainNav } from "@/components/features/main-nav"
import { generateMetadata, defaultSEOConfig } from "@/lib/seo/metadata"
import { JsonLd } from "@/components/features/seo/JsonLd"
import { GoogleAnalytics } from "@/components/features/seo/GoogleAnalytics"
import { organizationSchema } from "@/lib/seo/structured-data"
import { generateResourceHints } from "@/lib/seo/performance"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
})

// Enhanced SEO metadata using our new system
export const metadata: Metadata = generateMetadata({
  ...defaultSEOConfig,
  canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.brightdesigns.band'
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const resourceHints = generateResourceHints()
  
  return (
    <html lang="en">
      <head>
        {/* Resource hints for performance */}
        {resourceHints.map((hint, index) => (
          <link key={index} {...hint} />
        ))}
        
        {/* Additional SEO meta tags */}
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow,max-video-preview:-1,max-image-preview:large,max-snippet:-1" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-secondary`}>
        {/* Organization structured data */}
        <JsonLd data={organizationSchema} />
        
        {/* Google Analytics */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        
        {/* Performance monitoring */}
        
        
        <MainNav>{children}</MainNav>
      </body>
    </html>
  )
}
