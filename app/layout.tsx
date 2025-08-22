import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { ThemeProvider } from "@/components/theme-provider"
import { generateMetadata, defaultSEOConfig } from "@/lib/seo/metadata"
import { JsonLd } from "@/components/features/seo/JsonLd"
import { GoogleAnalytics } from "@/components/features/seo/GoogleAnalytics"
import { organizationSchema } from "@/lib/seo/structured-data"
import { generateResourceHints } from "@/lib/seo/performance"
import { ShowPlanProvider } from "@/lib/hooks/use-show-plan"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

// Remove display/serif fonts for cleaner startup feel

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
    <html lang="en" suppressHydrationWarning>
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
      <body className={`${inter.variable} font-sans`}>
        {/* Organization structured data */}
        <JsonLd data={organizationSchema} />
        
        {/* Google Analytics */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        
        {/* Performance monitoring */}
        
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ShowPlanProvider>
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </ShowPlanProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
