export type ThemeNavItem = {
	label: string
	href: string
	external?: boolean
}

export type ThemeCTA = {
	label: string
	href: string
	style?: 'primary' | 'outline' | 'ghost'
	iconRight?: boolean
}

export type ThemeSocialLink = {
	label: string
	href: string
	icon: 'x' | 'github' | 'linkedin' | 'youtube' | 'instagram'
}

export type ThemeFooterGroup = {
	title: string
	links: ThemeNavItem[]
}

export interface StartupThemeConfig {
	brand: {
		name: string
		logo?: string
		subtitle?: string
	}
	navigation: ThemeNavItem[]
	resources?: ThemeNavItem[]
	ctas: {
		primary?: ThemeCTA
		secondary?: ThemeCTA
	}
	social?: ThemeSocialLink[]
	footer?: {
		groups: ThemeFooterGroup[]
		copyright?: string
	}
	features?: {
		showAuthInHeaderOnAdmin?: boolean
	}
}

export const startupTheme: StartupThemeConfig = {
	brand: {
		name: 'Bright Designs',
		subtitle: 'Marching Arts + Music Design',
	},
	navigation: [
		{ label: 'Shows', href: '/shows' },
		{ label: 'About', href: '/about' },
		{ label: 'Process', href: '/process' },
	],
	resources: [
		{ label: 'Arrangements', href: '/arrangements' },
		{ label: 'FAQs', href: '/faqs' },
		{ label: 'Show Guide', href: '/guide' },
		{ label: 'Contact', href: '/contact' },
	],
	ctas: {
		primary: { label: 'Build Your Show', href: '/build', style: 'primary', iconRight: true },
		secondary: { label: 'Contact Us', href: '/contact', style: 'outline' },
	},
	social: [
		{ label: 'GitHub', href: 'https://github.com', icon: 'github' },
		{ label: 'YouTube', href: 'https://youtube.com', icon: 'youtube' },
	],
	footer: {
		groups: [
			{
				title: 'Company',
				links: [
					{ label: 'About', href: '/about' },
					{ label: 'Process', href: '/process' },
					{ label: 'Contact', href: '/contact' },
				],
			},
			{
				title: 'Resources',
				links: [
					{ label: 'Arrangements', href: '/arrangements' },
					{ label: 'FAQs', href: '/faqs' },
					{ label: 'Show Guide', href: '/guide' },
				],
			},
			{
				title: 'Legal',
				links: [
					{ label: 'Privacy Policy', href: '/privacy' },
					{ label: 'Terms of Service', href: '/terms' },
				],
			},
		],
		copyright: `© ${new Date().getFullYear()} Bright Designs. All rights reserved.`,
	},
	features: {
		showAuthInHeaderOnAdmin: true,
	},
}
