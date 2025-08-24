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

export const brand = { name: "Bright Designs Band" }

export const navigation: NavigationItem[] = [
  { label: "Home", href: "/" },
  { label: "Shows", href: "/shows" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export const resources: NavigationItem[] = [
  { label: "Theme Guide", href: "/docs/features/theme-system" },
  { label: "API Docs", href: "/docs/api" },
]

export const ctas: { primary?: CallToAction; secondary?: CallToAction } = {
  primary: { label: "Plan a Show", href: "/plan", iconRight: true },
  secondary: { label: "Contact Us", href: "/contact" },
}

export const footer: { groups: FooterGroup[]; copyright: string } = {
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
}

export const social: NavigationItem[] = [
  { label: "Instagram", href: "#" },
  { label: "Facebook", href: "#" },
]


