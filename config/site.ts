export type NavigationItem = {
  label: string
  href: string
}

export type CallToAction = {
  label: string
  href: string
  iconRight?: boolean
}

export type FooterGroup = {
  title: string
  links: NavigationItem[]
}

export interface SiteConfig {
  brand: {
    name: string
  }
  navigation: NavigationItem[]
  resources?: NavigationItem[]
  ctas: {
    primary?: CallToAction
    secondary?: CallToAction
  }
  footer?: {
    groups: FooterGroup[]
    copyright?: string
  }
  social?: NavigationItem[]
}

export const siteConfig: SiteConfig = {
  brand: {
    name: "Bright Designs Band",
  },
  navigation: [
    { label: "Home", href: "/" },
    { label: "Shows", href: "/shows" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
  ],
  resources: [
    { label: "Theme Guide", href: "/docs/features/theme-system" },
    { label: "API Docs", href: "/docs/api" },
  ],
  ctas: {
    // TODO: Uncomment when Build Your Show is production ready
    // primary: { label: "Build Your Show", href: "/build", iconRight: true },
    secondary: { label: "Contact Us", href: "/contact" },
  },
  footer: {
    groups: [
      {
        title: "Company",
        links: [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "FAQ", href: "/faqs" },
        ],
      },
      {
        title: "Explore",
        links: [
          { label: "Shows", href: "/shows" },
          { label: "Arrangements", href: "/arrangements" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Contact Form", href: "/contact" },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} Bright Designs LLC. All rights reserved.`,
  },
  social: [],
}

// Export individual properties for backward compatibility
export const brand = siteConfig.brand
export const navigation = siteConfig.navigation
export const resources = siteConfig.resources
export const ctas = siteConfig.ctas
export const footer = siteConfig.footer
export const social = siteConfig.social


