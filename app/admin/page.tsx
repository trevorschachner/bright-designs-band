import { createClient } from '@/lib/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, BarChart3, Tags, Music, Shield, Users, AlertTriangle, FileText } from 'lucide-react';
import { getUserRole, getUserPermissions } from '@/lib/auth/roles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbPage 
} from '@/components/ui/breadcrumb';
import { getDashboardStats } from '@/lib/database/queries';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // Fetch actual stats
  let stats;
  try {
    stats = await getDashboardStats();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    stats = {
      totalShows: 0,
      totalArrangements: 0,
      totalContacts: 0,
      totalFiles: 0,
      totalTags: 0,
    };
  }

  if (!session) {
    return redirect('/login');
  }

  const userRole = getUserRole(session.user.email || '');
  const permissions = getUserPermissions(session.user.email || '');
  const analyticsConfigured = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

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
              <div className="text-2xl font-bold">{stats.totalShows}</div>
              <p className="text-xs text-muted-foreground">Active shows</p>
              <Link href="/admin/shows" className="mt-4 inline-block w-full">
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
              <div className="text-2xl font-bold">{stats.totalTags}</div>
              <p className="text-xs text-muted-foreground">Total tags</p>
              <Link href="/admin/tags" className="mt-4 inline-block w-full">
                <Button className="w-full">
                  View Tags
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {permissions.canManageShows && (
          <Card className="frame-card cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manage Resources</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Downloadable files</p>
              <Link href="/admin/resources" className="mt-4 inline-block w-full">
                <Button className="w-full">
                  View Resources
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {permissions.canViewAnalytics && (
          <Card className="frame-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Web Analytics (PostHog)</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">
                {analyticsConfigured ? 'Connected' : 'Not Connected'}
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsConfigured
                  ? 'PostHog is active and collecting product analytics. Open PostHog to explore funnels, session recordings, and dashboards.'
                  : 'Set NEXT_PUBLIC_POSTHOG_KEY (and optional NEXT_PUBLIC_POSTHOG_HOST) to enable PostHog analytics tracking.'}
              </p>
              <Button className="w-full" asChild variant={analyticsConfigured ? 'default' : 'outline'}>
                <a
                  href={
                    analyticsConfigured
                      ? posthogHost
                      : 'https://posthog.com/docs/getting-started/quick-start/web'
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {analyticsConfigured ? 'Open PostHog' : 'PostHog Setup Guide'}
                </a>
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

    </div>
  );
} 