import { redirect } from 'next/navigation'
import { guard } from '@/lib/auth/guard'
import { listAdminUsers } from '@/lib/actions/admin-users'
import { AdminUsersTable } from '@/components/features/admin/AdminUsersTable'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'

export const dynamic = 'force-dynamic'

/** Owners only. The layout already requires admin access; this narrows it. */
export default async function AdminUsersPage() {
  const gate = await guard('canManageUsers')
  if (gate.denied) redirect('/admin')

  const result = await listAdminUsers()

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-4xl font-bold mb-2">Users</h1>
      <p className="text-muted-foreground mb-8 max-w-2xl">
        Only the addresses listed here can sign in to the admin. Owners can manage this list; editors can manage
        everything else. Changes apply on the person&apos;s next page load.
      </p>
      {result.ok ? (
        <AdminUsersTable initialUsers={result.data} currentEmail={gate.email.toLowerCase()} />
      ) : (
        <p className="text-destructive">The user list could not be loaded. Try again shortly.</p>
      )}
    </div>
  )
}
