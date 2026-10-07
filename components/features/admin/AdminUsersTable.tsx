'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { addAdminUser, removeAdminUser, setAdminUserRole } from '@/lib/actions/admin-users'
import type { ActionResult } from '@/lib/actions/result'
import type { AdminUserRow } from '@/lib/services/admin-users'
import type { AdminRole } from '@/lib/auth/permissions'

const ERROR_TEXT: Record<string, string> = {
  forbidden: 'You no longer have permission to manage users.',
  invalid: 'Check the highlighted fields.',
  not_found: 'That user was already removed. The list has been refreshed.',
  conflict: 'That change is not allowed.',
  stale: 'The list changed. It has been refreshed.',
  failed: 'Something went wrong. Try again.',
}

function messageFor(result: Extract<ActionResult<unknown>, { ok: false }>): string {
  return result.issues?.[0]?.message ?? ERROR_TEXT[result.error] ?? ERROR_TEXT.failed
}

export function AdminUsersTable({
  initialUsers,
  currentEmail,
}: {
  initialUsers: AdminUserRow[]
  currentEmail: string
}) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<AdminRole>('editor')
  const [removing, setRemoving] = useState<string | null>(null)

  const run = (action: () => Promise<ActionResult<AdminUserRow[]>>, onSuccess?: () => void) => {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result.ok) {
        setUsers(result.data)
        onSuccess?.()
      } else {
        setError(messageFor(result))
      }
      // Re-render server parts too: demoting yourself removes the Users link.
      router.refresh()
    })
  }

  const ownerCount = users.filter((u) => u.role === 'owner').length

  return (
    <div className="space-y-8">
      <form
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => addAdminUser({ email: newEmail, role: newRole }), () => setNewEmail(''))
        }}
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="admin-user-email">Email</Label>
          <Input
            id="admin-user-email"
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2 sm:w-40">
          <Label htmlFor="admin-user-role">Role</Label>
          <Select value={newRole} onValueChange={(value) => setNewRole(value as AdminRole)}>
            <SelectTrigger id="admin-user-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Add user'}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Added by</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Remove</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelf = user.email === currentEmail
            const isLastOwner = user.role === 'owner' && ownerCount <= 1
            return (
              <TableRow key={user.email}>
                <TableCell className="font-medium">
                  {user.email}
                  {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    disabled={pending || isLastOwner}
                    onValueChange={(value) => run(() => setAdminUserRole({ email: user.email, role: value }))}
                  >
                    <SelectTrigger className="w-32" aria-label={`Role for ${user.email}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.addedBy ?? '-'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US') : '-'}
                </TableCell>
                <TableCell>
                  <AlertDialog
                    open={removing === user.email}
                    onOpenChange={(open) => setRemoving(open ? user.email : null)}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-8 h-8 p-0"
                        disabled={pending || isSelf || isLastOwner}
                        title={isSelf ? 'You cannot remove yourself' : isLastOwner ? 'The last owner cannot be removed' : undefined}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove {user.email}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {user.email}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          They lose admin access on their next page load. You can add them again later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault()
                            run(() => removeAdminUser({ email: user.email }), () => setRemoving(null))
                          }}
                          disabled={pending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {pending ? 'Removing…' : 'Remove'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
