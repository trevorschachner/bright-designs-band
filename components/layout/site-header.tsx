"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, Music, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import type { NavigationItem, CallToAction } from "@/config/site"
import { useShowPlan } from "@/lib/hooks/use-show-plan"
 
type SiteHeaderProps = {
	brand: { name: string }
	navigation: NavigationItem[]
	resources?: NavigationItem[]
	ctas: { primary?: CallToAction; secondary?: CallToAction }
}

export function SiteHeader({ brand, navigation, resources, ctas }: SiteHeaderProps) {
	const pathname = usePathname()
	const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount } = useShowPlan()

	const isActive = (href: string) => pathname === href

	return (
		<header className="sticky top-0 z-50 w-full plus-surface-elevated">
			<div className="plus-container flex h-16 items-center justify-between">
				<Link href="/" className="flex items-center gap-3">
					<div className="h-10 w-10 plus-surface flex items-center justify-center">
						<Music className="h-6 w-6 text-foreground" />
					</div>
					<span className="plus-h4">{brand.name}</span>
				</Link>

				<nav className="hidden md:flex items-center gap-6">
					{navigation.map(item => (
						<Link key={item.href} href={item.href} className={`plus-label transition-colors ${isActive(item.href) ? 'text-primary border-b-2 border-primary pb-1' : 'text-muted-foreground hover:text-foreground'}`}>
							{item.label}
						</Link>
					))}
					<DropdownMenu>
						<DropdownMenuTrigger className="plus-label text-muted-foreground hover:text-foreground transition-colors">Resources</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-64 plus-surface-elevated">
							<div className="p-2 grid gap-1">
								{resources?.map(item => (
									<Link key={item.href} href={item.href} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
										{item.label}
									</Link>
								))}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</nav>

				<div className="hidden md:flex items-center gap-2">
					<ThemeToggle />
					{ctas.secondary && (
						<Button variant="outline" size="sm" asChild>
							<Link href={ctas.secondary.href}>{ctas.secondary.label}</Link>
						</Button>
					)}
					{ctas.primary && (
						<Button variant="default" size="sm" asChild>
							<Link href={ctas.primary.href}>
								{ctas.primary.label}
                {itemCount > 0 && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full">{itemCount}</span>}
								{ctas.primary.iconRight && (<ArrowRight className="ml-2 h-4 w-4" />)}
							</Link>
						</Button>
					)}
				</div>

				<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon" className="md:hidden wireframe-border">
							<Menu className="h-6 w-6" />
							<span className="sr-only">Toggle menu</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="w-[320px] wireframe-border bg-background">
						<div className="mt-8 grid gap-6">
							<nav className="grid gap-3">
								{navigation.map(item => (
									<Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`wireframe-border px-4 py-3 text-sm font-medium uppercase tracking-wide ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
										{item.label}
									</Link>
								))}
								{resources?.length ? (
									<div className="pt-4 wireframe-border-dashed border-t">
										<p className="px-4 pb-3 text-xs font-bold wireframe-subheading">RESOURCES</p>
										{resources.map(item => (
											<Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="wireframe-border px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
												{item.label}
											</Link>
										))}
									</div>
								) : null}
							</nav>
							<div className="grid gap-3 pt-4 wireframe-border-dashed border-t">
								{ctas.secondary && (
									<Button className="btn-wireframe-secondary w-full h-12 text-xs uppercase tracking-wide" asChild>
										<Link href={ctas.secondary.href} onClick={() => setMobileOpen(false)}>{ctas.secondary.label}</Link>
									</Button>
								)}
								{ctas.primary && (
									<Button className="btn-wireframe-primary w-full h-12 text-xs uppercase tracking-wide" asChild>
										<Link href={ctas.primary.href} onClick={() => setMobileOpen(false)}>
											{ctas.primary.label}
                      {itemCount > 0 && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-destructive text-destructive-foreground wireframe-border">{itemCount}</span>}
											{ctas.primary.iconRight && (<ArrowRight className="ml-2 h-4 w-4" />)}
										</Link>
									</Button>
								)}
							</div>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	)
}
