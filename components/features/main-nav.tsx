"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Blocks,
  FileText,
  HelpCircle,
  Home,
  Info,
  LogIn,
  Mail,
  Music,
  User,
  Menu,
  X,
  ChevronDown,
  Monitor,
  Sparkles,
  Target,
  MessageCircle,
  ArrowRight,
  LogOut,
  Settings,
  Shield,
  UserCircle,
} from "lucide-react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/utils/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getUserRole, getUserPermissions } from "@/lib/auth/roles"

export function MainNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('user')
  const [permissions, setPermissions] = useState<any>({})
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const currentUser = session?.user || null
      setUser(currentUser)
      
      if (currentUser?.email) {
        const role = getUserRole(currentUser.email)
        const userPermissions = getUserPermissions(currentUser.email)
        setUserRole(role)
        setPermissions(userPermissions)
      }
      
      setLoading(false)
    }
    
    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user || null
        setUser(currentUser)
        
        if (currentUser?.email) {
          const role = getUserRole(currentUser.email)
          const userPermissions = getUserPermissions(currentUser.email)
          setUserRole(role)
          setPermissions(userPermissions)
        } else {
          setUserRole('user')
          setPermissions({})
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const isActive = (path: string) => pathname === path

  const navigationItems = [
    { name: "Shows", href: "/shows", icon: Music },
    { name: "About", href: "/about", icon: Info },
    { name: "Process", href: "/process", icon: Target },
  ]

  const resourceItems = [
    {
      title: "Arrangements",
      href: "/arrangements",
      description: "Browse our collection of musical arrangements",
      icon: Music,
    },
    {
      title: "FAQs",
      href: "/faqs",
      description: "Frequently asked questions",
      icon: HelpCircle,
    },
    {
      title: "Show Guide",
      href: "/guide",
      description: "How to plan your perfect show",
      icon: BookOpen,
    },
    {
      title: "Contact",
      href: "/contact",
      description: "Get in touch with our team",
      icon: MessageCircle,
    },
  ]

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'staff': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-bright-primary rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-bright-dark" />
            </div>
            <span className="text-xl font-bold text-bright-dark font-primary">Bright Designs</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-bright-third"
                    : "text-muted-foreground hover:text-bright-third"
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Resources Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center text-sm font-medium text-muted-foreground hover:text-bright-third transition-colors">
                Resources
                <ChevronDown className="ml-1 w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-4">
                <div className="space-y-4">
                  {resourceItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-bright-primary/10 rounded-lg flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-bright-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-gray-900">{item.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <Button className="btn-outline" size="sm" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
            <Button className="btn-primary" size="sm" asChild>
              <Link href="/build">
                Build Your Show
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            
            {/* User Menu - Only show auth controls on admin pages */}
            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                        <AvatarFallback>
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.user_metadata?.full_name || user.email}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <Badge className={`${getRoleBadgeColor(userRole)} text-xs w-fit mt-1`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {userRole.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {permissions.canAccessAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          Staff Area
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        {permissions.canManageShows && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin/shows">
                              <Music className="mr-2 h-4 w-4" />
                              <span>Manage Shows</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Only show sign in button on admin pages
                pathname.startsWith('/admin') && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">
                      <LogIn className="mr-2 w-4 h-4" />
                      Sign In
                    </Link>
                  </Button>
                )
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-4 mt-6">
                {/* Mobile Logo */}
                <div className="flex items-center gap-2 pb-4 border-b">
                  <div className="w-8 h-8 bg-bright-primary rounded-lg flex items-center justify-center">
                    <Music className="w-5 h-5 text-bright-dark" />
                  </div>
                  <span className="text-xl font-bold text-bright-dark font-primary">Bright Designs</span>
                </div>

                <nav className="flex flex-col space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? "bg-bright-primary/10 text-bright-third"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}

                  {/* Mobile Resources */}
                  <div className="pt-2">
                    <h4 className="px-3 py-2 text-sm font-semibold text-gray-900">Resources</h4>
                    {resourceItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </nav>

                <div className="border-t pt-4 space-y-2">
                  {!loading && (
                    user ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 px-3 py-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                            <AvatarFallback>
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="font-medium text-sm">{user.user_metadata?.full_name || user.email}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <Badge className={`${getRoleBadgeColor(userRole)} text-xs w-fit mt-1`}>
                              <Shield className="w-3 h-3 mr-1" />
                              {userRole.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                            <UserCircle className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </Button>
                        
                        {permissions.canAccessAdmin && (
                          <>
                            <div className="px-3 py-1">
                              <p className="text-xs text-muted-foreground font-medium">STAFF AREA</p>
                            </div>
                            <Button variant="ghost" className="w-full justify-start" asChild>
                              <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Admin Dashboard
                              </Link>
                            </Button>
                            {permissions.canManageShows && (
                              <Button variant="ghost" className="w-full justify-start" asChild>
                                <Link href="/admin/shows" onClick={() => setMobileMenuOpen(false)}>
                                  <Music className="mr-2 h-4 w-4" />
                                  Manage Shows
                                </Link>
                              </Button>
                            )}
                          </>
                        )}
                        
                        <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    ) : (
                      // Only show sign in button on admin pages in mobile menu
                      pathname.startsWith('/admin') && (
                        <Button variant="ghost" className="w-full justify-start" asChild>
                          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                            <LogIn className="mr-2 w-4 h-4" />
                            Sign In
                          </Link>
                        </Button>
                      )
                    )
                  )}
                  <Button className="btn-outline w-full" asChild>
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
                  </Button>
                  <Button className="btn-primary w-full" asChild>
                    <Link href="/build" onClick={() => setMobileMenuOpen(false)}>
                      Build Your Show
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
} 