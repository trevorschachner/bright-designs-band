import Link from "next/link"
import { startupTheme } from "@/config/theme.config"

export function SiteFooter() {
	return (
		<footer className="border-t bg-background">
			<div className="container mx-auto px-4 py-10">
				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					{startupTheme.footer?.groups.map(group => (
						<div key={group.title}>
							<h4 className="text-sm font-semibold text-foreground mb-3">{group.title}</h4>
							<ul className="space-y-2">
								{group.links.map(link => (
									<li key={link.href}>
										<Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<div className="mt-8 flex items-center justify-between">
					<p className="text-xs text-muted-foreground">{startupTheme.footer?.copyright}</p>
					{startupTheme.social?.length ? (
						<div className="flex items-center gap-4">
							{startupTheme.social.map(s => (
								<Link key={s.label} href={s.href} className="text-sm text-muted-foreground hover:text-foreground">
									{s.label}
								</Link>
							))}
						</div>
					) : null}
				</div>
			</div>
		</footer>
	)
}
