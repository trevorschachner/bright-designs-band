import Link from 'next/link'
import type { AdminRole } from '@/lib/auth/permissions'

/**
 * Admin section links. Server component: the admin layout passes the role it
 * already resolved, so "Users" is only rendered for owners. The page itself
 * still checks (guard('canManageUsers')); hiding the link is not the control.
 */
const LINKS: { href: string; label: string; ownerOnly?: boolean }[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/shows', label: 'Shows' },
  { href: '/admin/tags', label: 'Tags' },
  { href: '/admin/pieces', label: 'Pieces' },
  { href: '/admin/resources', label: 'Resources' },
  { href: '/admin/users', label: 'Users', ownerOnly: true },
]

export function AdminNav({ role }: { role: AdminRole }) {
  return (
    <nav aria-label="Admin" className="border-b border-border bg-background">
      <ul className="container mx-auto flex flex-wrap gap-x-6 gap-y-2 px-4 py-3 text-sm">
        {LINKS.filter((link) => !link.ownerOnly || role === 'owner').map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
