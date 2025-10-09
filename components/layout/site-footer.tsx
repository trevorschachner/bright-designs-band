"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Music, Mail, Phone, MapPin } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { NavigationItem, FooterGroup } from "@/config/site"

type SiteFooterProps = {
  footer?: { groups: FooterGroup[]; copyright?: string }
  social?: NavigationItem[]
}

export function SiteFooter({ footer, social }: SiteFooterProps) {
	return (
		<footer className="bg-background border-t border-border">
			<div className="plus-container py-16">
				<div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
					{/* Company/Brand column */}
					<div className="lg:col-span-2">
						<div className="flex items-center gap-3 mb-2">
							<div className="h-10 w-10 plus-surface flex items-center justify-center">
								<Music className="h-6 w-6 text-primary" />
							</div>
							<span className="plus-h4">Bright Designs Band</span>
						</div>
						<p className="plus-caption text-muted-foreground mb-6">
							© {new Date().getFullYear()} Bright Designs LLC. All rights reserved.
						</p>
						<p className="plus-body-sm text-muted-foreground mb-8 max-w-sm">
							Custom marching band show design and arrangements. Let's bring your vision to life with expert design and passion.
						</p>
						<div className="flex flex-col sm:flex-row gap-3">
							<Button asChild size="sm" className="plus-btn-primary">
								<Link href="/contact">
									<Mail className="h-4 w-4" />
									Contact Us
								</Link>
							</Button>
							{/* TODO: Uncomment when Build Your Show is production ready */}
							{/* <Button asChild variant="outline" size="sm" className="plus-btn-outline">
								<Link href="/build">
									Build Show
								</Link>
							</Button> */}
						</div>
					</div>

					{/* Footer links columns */}
					{footer?.groups.map(group => (
						<div key={group.title}>
							<h4 className="plus-h4 mb-6">{group.title}</h4>
							<ul className="space-y-4">
								{group.links.map(link => (
									<li key={link.href}>
										<Link 
											href={link.href} 
											className="plus-body-sm text-muted-foreground hover:text-foreground transition-colors"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

			{/* Contact info row */}
			<div className="mt-12 pt-8 border-t border-border">
				<div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
					<div className="flex flex-col sm:flex-row gap-6">
						<div className="flex items-center gap-2">
							<Mail className="h-4 w-4 text-muted-foreground" />
							<Link href="mailto:hello@brightdesigns.band" className="plus-body-sm text-muted-foreground hover:text-foreground transition-colors">
								hello@brightdesigns.band
							</Link>
						</div>
						<div className="flex items-center gap-2">
							<MapPin className="h-4 w-4 text-muted-foreground" />
							<span className="plus-body-sm text-muted-foreground">
								South Carolina, Georgia, and Virginia
							</span>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2 text-muted-foreground">
							<span className="plus-body-sm">Crafted with</span>
							<span className="text-red-500">♫</span>
							<span className="plus-body-sm">and passion in South Carolina</span>
						</div>
						<ThemeToggle />
					</div>
				</div>
			</div>
			</div>
		</footer>
	)
}
