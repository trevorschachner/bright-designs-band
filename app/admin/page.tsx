import { createClient } from '@/lib/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, BarChart3, Tags, Music, Shield, Users, AlertTriangle } from 'lucide-react';
import { getUserRole, getUserPermissions } from '@/lib/auth/roles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbPage 
} from '@/components/ui/breadcrumb';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return redirect('/login');
  }

  const userRole = getUserRole(session.user.email || '');
  const permissions = getUserPermissions(session.user.email || '');

  // Check if user has admin access
  if (!permissions.canAccessAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don&apos;t have permission to access the admin dashboard. Contact an administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
        <div className="text-center mt-4">
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Admin Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground font-primary">Admin Dashboard</h1>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-muted-foreground">Welcome back, {session.user.email}</p>
            <Badge className={getRoleBadgeColor(userRole)}>
              <Shield className="w-3 h-3 mr-1" />
              {userRole.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Online</span>
          </Badge>
          <form action="/auth/signout" method="post">
            <Button type="submit">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {permissions.canManageShows && (
          <Card className="frame-card cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Shows</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Active shows</p>
              <Link href="/admin/shows" className="mt-4 inline-block">
                <Button className="w-full">
                  View Shows
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {permissions.canManageTags && (
          <Card className="frame-card cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Tags</CardTitle>
              <Tags className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Total tags</p>
              <Link href="/admin/tags" className="mt-4 inline-block">
                <Button className="w-full">
                  View Tags
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {permissions.canViewAnalytics && (
          <Card className="frame-card cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4k</div>
              <p className="text-xs text-muted-foreground">Page views this month</p>
              <Button className="w-full mt-4">
                View Analytics
              </Button>
            </CardContent>
          </Card>
        )}

        {permissions.canManageUsers && (
          <Card className="frame-card cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Management</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
              <Button className="w-full mt-4">
                Manage Users
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8">
        <Card className="frame-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {permissions.canCreateArrangements && (
                <Link href="/admin/shows/new">
                  <Button className="w-full h-20 flex flex-col space-y-2">
                    <Music className="w-6 h-6" />
                    <span>Add New Show</span>
                  </Button>
                </Link>
              )}
              {permissions.canManageTags && (
                <Button className="w-full h-20 flex flex-col space-y-2">
                  <Tags className="w-6 h-6" />
                  <span>Manage Categories</span>
                </Button>
              )}
              {permissions.canViewAnalytics && (
                <Button className="w-full h-20 flex flex-col space-y-2">
                  <BarChart3 className="w-6 h-6" />
                  <span>View Reports</span>
                </Button>
              )}
              <Button className="w-full h-20 flex flex-col space-y-2">
                <Settings className="w-6 h-6" />
                <span>Site Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific information */}
      <div className="mt-8">
        <Card className="frame-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Your Permissions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className={`p-3 rounded-lg ${permissions.canAccessAdmin ? 'bg-green-50 text-green-800' : 'bg-muted/30 text-muted-foreground'}`}>
                <div className="font-medium">Admin Access</div>
                <div className="text-xs">{permissions.canAccessAdmin ? 'Granted' : 'Denied'}</div>
              </div>
              <div className={`p-3 rounded-lg ${permissions.canManageShows ? 'bg-green-50 text-green-800' : 'bg-muted/30 text-muted-foreground'}`}>
                <div className="font-medium">Manage Shows</div>
                <div className="text-xs">{permissions.canManageShows ? 'Granted' : 'Denied'}</div>
              </div>
              <div className={`p-3 rounded-lg ${permissions.canManageUsers ? 'bg-green-50 text-green-800' : 'bg-muted/30 text-muted-foreground'}`}>
                <div className="font-medium">Manage Users</div>
                <div className="text-xs">{permissions.canManageUsers ? 'Granted' : 'Denied'}</div>
              </div>
              <div className={`p-3 rounded-lg ${permissions.canDeleteArrangements ? 'bg-green-50 text-green-800' : 'bg-muted/30 text-muted-foreground'}`}>
                <div className="font-medium">Delete Content</div>
                <div className="text-xs">{permissions.canDeleteArrangements ? 'Granted' : 'Denied'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 