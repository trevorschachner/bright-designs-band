'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Music, Shield, AlertCircle, Users, Eye, EyeOff, Check, RefreshCw } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const supabase = createClient()

  // Check for error messages from URL params
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
    }
  }, [searchParams])

  const signInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading('signin')
      setError(null)
      setSuccess(null)
      
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else {
          setError(error.message)
        }
      } else {
        // Success - user will be redirected by auth state change
        router.push('/auth/callback')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const signUpWithEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading('signup')
      setError(null)
      setSuccess(null)

      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        setLoading(null)
        return
      }

      // Validate password strength
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long')
        setLoading(null)
        return
      }
      
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your email for a verification link! You must verify your email before signing in.')
        setFormData({ email: '', password: '', confirmPassword: '' })
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const sendMagicLink = async () => {
    try {
      setLoading('magic')
      setError(null)
      setSuccess(null)
      
      if (!formData.email) {
        setError('Please enter your email address')
        setLoading(null)
        return
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Check your email for a login link!')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const resendVerification = async () => {
    try {
      setLoading('resend')
      setError(null)
      setSuccess(null)
      
      if (!formData.email) {
        setError('Please enter your email address')
        setLoading(null)
        return
      }
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Verification email sent! Check your inbox.')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bright-primary/5 via-white to-bright-third/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-bright-primary rounded-xl flex items-center justify-center">
              <Music className="w-8 h-8 text-bright-dark" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-bright-dark font-primary">
                Welcome to Bright Designs
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Sign in to access your account and explore our shows
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                  {error.includes('Email not confirmed') && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resendVerification}
                        disabled={loading !== null || !formData.email}
                        className="w-full"
                      >
                        {loading === 'resend' ? (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 h-3 mr-2" />
                            Resend Verification Email
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Email/Password Forms */}
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-4">
                <form onSubmit={signInWithEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading !== null}
                  >
                    {loading === 'signin' ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={signUpWithEmail} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 characters)"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading !== null}
                  >
                    {loading === 'signup' ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Magic Link Section */}
            <div className="border-t pt-6">
              <div className="text-center mb-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Prefer passwordless login?</h3>
                <p className="text-xs text-gray-600">We'll send you a secure link to sign in</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email for Magic Link</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <Button
                  onClick={sendMagicLink}
                  variant="outline"
                  className="w-full"
                  disabled={loading !== null}
                >
                  {loading === 'magic' ? (
                    <>
                      <Mail className="w-4 h-4 mr-2 animate-pulse" />
                      Sending Magic Link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-sm text-blue-800 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Account Types</span>
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>• @brightdesigns.band emails:</span>
                    <span className="font-medium">Staff Access</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• All other accounts:</span>
                    <span className="font-medium">User Access</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-4">
                <Shield className="w-4 h-4" />
                <span>Secure authentication with email verification</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            className="text-gray-500 hover:text-bright-dark transition-colors"
            onClick={() => router.push('/')}
          >
            ← Back to website
          </Button>
        </div>
      </div>
    </div>
  )
} 