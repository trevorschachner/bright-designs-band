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

export interface StartupTheme {
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

export const startupTheme: StartupTheme = {
  brand: {
    name: "Bright Designs Band",
  },
  navigation: [
    { label: "Home", href: "/" },
    { label: "Shows", href: "/shows" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  resources: [
    { label: "Theme Guide", href: "/docs/features/theme-system" },
    { label: "API Docs", href: "/docs/api" },
  ],
  ctas: {
    primary: { label: "Plan a Show", href: "/plan", iconRight: true },
    secondary: { label: "Contact Us", href: "/contact" },
  },
  footer: {
    groups: [
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Explore",
        links: [
          { label: "Upcoming Shows", href: "/shows" },
          { label: "Home", href: "/" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Theme Guide", href: "/docs/features/theme-system" },
          { label: "API Docs", href: "/docs/api" },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} Bright Designs Band. All rights reserved.`,
  },
  social: [
    { label: "Instagram", href: "#" },
    { label: "Facebook", href: "#" },
  ],
}

export default startupTheme


