import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shield, Mail, Calendar, Settings } from 'lucide-react'
import { getUserRole, getUserPermissions } from '@/lib/auth/roles'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const userRole = getUserRole(session.user.email || '')
  const permissions = getUserPermissions(session.user.email || '')

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-bright-dark font-primary">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account information and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={session.user.user_metadata?.avatar_url} alt={session.user.email} />
                  <AvatarFallback className="text-lg">
                    {session.user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">
                    {session.user.user_metadata?.full_name || session.user.email}
                  </h3>
                  <p className="text-gray-600">{session.user.email}</p>
                  <Badge className={getRoleBadgeColor(userRole)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {userRole.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Email verified</span>
                  <Badge variant={session.user.email_confirmed_at ? 'default' : 'secondary'}>
                    {session.user.email_confirmed_at ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Member since</span>
                  <span className="text-sm font-medium">
                    {formatDate(session.user.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Your Permissions</CardTitle>
              <CardDescription>
                Your current access level and what you can do on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${permissions.canAccessAdmin ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="font-medium text-sm">Admin Access</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {permissions.canAccessAdmin ? 'You can access the admin dashboard' : 'Standard user access only'}
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${permissions.canManageShows ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="font-medium text-sm">Manage Shows</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {permissions.canManageShows ? 'You can create and edit shows' : 'View shows only'}
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${permissions.canManageTags ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="font-medium text-sm">Manage Tags</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {permissions.canManageTags ? 'You can create and edit tags' : 'View tags only'}
                  </div>
                </div>
                <div className={`p-4 rounded-lg border ${permissions.canManageUsers ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="font-medium text-sm">User Management</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {permissions.canManageUsers ? 'You can manage other users' : 'No user management access'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.canAccessAdmin && (
                <Button asChild className="w-full">
                  <Link href="/admin">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Dashboard
                  </Link>
                </Button>
              )}
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/shows">
                  <Shield className="w-4 h-4 mr-2" />
                  Browse Shows
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/build">
                  <Settings className="w-4 h-4 mr-2" />
                  Build Your Show
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Type Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              {userRole === 'staff' ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-800">Staff Member</p>
                  <p className="text-blue-700">You have elevated access as a Bright Designs staff member.</p>
                </div>
              ) : userRole === 'admin' ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-800">Administrator</p>
                  <p className="text-red-700">You have full administrative access to the platform.</p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="font-medium text-gray-800">User Account</p>
                  <p className="text-gray-700">You have standard user access to browse and build shows.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 