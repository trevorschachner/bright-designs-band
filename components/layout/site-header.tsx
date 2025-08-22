"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Menu, Music, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { startupTheme } from "@/config/theme.config"
import { useShowPlan } from "@/lib/hooks/use-show-plan"
 
export function SiteHeader() {
	const pathname = usePathname()
	const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount } = useShowPlan()

	const isActive = (href: string) => pathname === href

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/95 dark:bg-white/95 backdrop-blur-sm text-slate-800 shadow-sm">
			<div className="container mx-auto flex h-14 items-center justify-between px-4">
				<Link href="/" className="flex items-center gap-2">
					<div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
						<Music className="h-5 w-5 text-primary" />
					</div>
					<span className="text-base font-semibold tracking-tight text-slate-900">{startupTheme.brand.name}</span>
				</Link>

				<nav className="hidden md:flex items-center gap-6">
					{startupTheme.navigation.map(item => (
						<Link key={item.href} href={item.href} className={`text-sm font-medium transition-colors hover:text-primary ${isActive(item.href) ? 'text-primary' : 'text-slate-600'}`}>
							{item.label}
						</Link>
					))}
					<DropdownMenu>
						<DropdownMenuTrigger className="text-sm font-medium transition-colors text-slate-600 hover:text-primary">Resources</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-64">
							<div className="p-2 grid gap-1">
								{startupTheme.resources?.map(item => (
									<Link key={item.href} href={item.href} className="rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
										{item.label}
									</Link>
								))}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				</nav>

				<div className="hidden md:flex items-center gap-2">
					{startupTheme.ctas.secondary && (
						<Button className="btn-secondary" size="sm" asChild>
							<Link href={startupTheme.ctas.secondary.href}>{startupTheme.ctas.secondary.label}</Link>
						</Button>
					)}
					{startupTheme.ctas.primary && (
						<Button className="btn-primary" size="sm" asChild>
							<Link href={startupTheme.ctas.primary.href}>
								{startupTheme.ctas.primary.label}
                {itemCount > 0 && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">{itemCount}</span>}
								{startupTheme.ctas.primary.iconRight && (<ArrowRight className="ml-2 h-4 w-4" />)}
							</Link>
						</Button>
					)}
				</div>

				<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon" className="md:hidden">
							<Menu className="h-5 w-5" />
							<span className="sr-only">Toggle menu</span>
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="w-[320px]">
						<div className="mt-6 grid gap-4">
							<nav className="grid gap-2">
								{startupTheme.navigation.map(item => (
									<Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`rounded-md px-3 py-2 text-sm ${isActive(item.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
										{item.label}
									</Link>
								))}
								{startupTheme.resources?.length ? (
									<div className="pt-2">
										<p className="px-3 pb-2 text-xs font-medium text-muted-foreground">RESOURCES</p>
										{startupTheme.resources.map(item => (
											<Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground">
												{item.label}
											</Link>
										))}
									</div>
								) : null}
							</nav>
							<div className="grid gap-2">
								{startupTheme.ctas.secondary && (
									<Button className="btn-secondary w-full" asChild>
										<Link href={startupTheme.ctas.secondary.href} onClick={() => setMobileOpen(false)}>{startupTheme.ctas.secondary.label}</Link>
									</Button>
								)}
								{startupTheme.ctas.primary && (
									<Button className="btn-primary w-full" asChild>
										<Link href={startupTheme.ctas.primary.href} onClick={() => setMobileOpen(false)}>
											{startupTheme.ctas.primary.label}
                      {itemCount > 0 && <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">{itemCount}</span>}
											{startupTheme.ctas.primary.iconRight && (<ArrowRight className="ml-2 h-4 w-4" />)}
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
