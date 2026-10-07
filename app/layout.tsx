import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
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
import { ShowPlanProvider } from "@/lib/hooks/use-show-plan"
import { GlobalAudioPlayerBar } from "@/components/features/global-audio-player-bar"
import { AudioProvider } from "@/components/features/audio/AudioProvider"
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton"

import { GlobalSpotlight } from "@/components/ui/global-spotlight"
import { GlobalBackground } from "@/components/ui/global-background"
import { getPublicSiteUrl } from "@/lib/env"
import { Toaster } from "@/components/ui/toaster"

const poppins = Poppins({
  subsets: ["latin"],
  // Every weight the site uses: 300 (body, font-light), 400 (font-normal, and
  // <strong>/<b> = bolder than 300), 500 (font-medium), 600 (font-semibold),
  // 700 (font-bold), 800 (typography prose h1 on /privacy and /terms).
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
})

// Remove display/serif fonts for cleaner startup feel

// Enhanced SEO metadata using our new system
export const metadata: Metadata = generateMetadata({
  ...defaultSEOConfig,
  canonical: getPublicSiteUrl(),
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Additional SEO meta tags */}
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow,max-video-preview:-1,max-image-preview:large,max-snippet:-1" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        
        {/* Favicon and app icons */}
        <link rel="icon" href="/logos/favicon.ico" sizes="any" />
        <link rel="icon" href="/logos/brightdesignslogo-main.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logos/apple-touch-icon.png" />
        <link rel="manifest" href="/logos/manifest.json" />
      </head>
      <body suppressHydrationWarning className={`${poppins.variable} font-sans font-light`}>
        {/* Organization and Local Business structured data */}
        <JsonLd data={organizationSchema} />
        <JsonLd data={localBusinessSchema} />
        
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <GlobalBackground />
          <GlobalSpotlight />
          <ShowPlanProvider>
            <AudioProvider>
              <SiteHeader brand={brand} navigation={navigation} resources={resources} ctas={ctas} />
              <Suspense fallback={<PageLoadingSkeleton />}>
                <main>{children}</main>
              </Suspense>
              <CTASection />
              <SiteFooter footer={footer} social={social} />
              <GlobalAudioPlayerBar />
            </AudioProvider>
            <Toaster />
          </ShowPlanProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
