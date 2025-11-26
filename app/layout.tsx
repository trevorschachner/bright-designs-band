import type React from "react"
import type { Metadata } from "next"
import { Inter, Poppins } from "next/font/google"
import { Suspense } from "react"
import "./globals.css"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { CTASection } from "@/components/layout/cta-section"
import { brand, navigation, resources, ctas, footer, social } from "@/config/site"
import { ThemeProvider } from "@/components/theme-provider"
import { generateMetadata, defaultSEOConfig } from "@/lib/seo/metadata"
import { JsonLd } from "@/components/features/seo/JsonLd"
import { organizationSchema, localBusinessSchema } from "@/lib/seo/structured-data"
import { generateResourceHints } from "@/lib/seo/performance"
import { ShowPlanProvider } from "@/lib/hooks/use-show-plan"
import { GlobalAudioPlayerBar } from "@/components/features/global-audio-player-bar"
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
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
  // TODO(posthog): Restore PostHog environment variables when analytics go live.
  // const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  // const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
  
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
      <body suppressHydrationWarning className={`${inter.variable} ${poppins.variable} font-sans font-light`}>
        {/* Organization and Local Business structured data */}
        <JsonLd data={organizationSchema} />
        <JsonLd data={localBusinessSchema} />
        
        {/* TODO(posthog): Re-enable PostHogProvider for analytics tracking. */}
        {/*
        <PostHogProvider apiKey={posthogKey} apiHost={posthogHost} />
        */}
        
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ShowPlanProvider>
            <SiteHeader brand={brand} navigation={navigation} resources={resources} ctas={ctas} />
            <Suspense fallback={<PageLoadingSkeleton />}>
              <main className="pb-20">{children}</main>
            </Suspense>
            <CTASection />
            <SiteFooter footer={footer} social={social} />
            <GlobalAudioPlayerBar />
          </ShowPlanProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
