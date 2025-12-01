'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { Mail, Music, Shield, AlertCircle, Check, RefreshCw, KeyRound, ArrowLeft } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(decodeURIComponent(urlError))
    }
  }, [searchParams])

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)
      
      if (!email) {
        setError('Please enter your email address')
        setLoading(false)
        return
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`
        }
      })
      
      if (error) {
        setError(`Login error: ${error.message}`)
      } else {
        setSuccess('Check your email for a login link or code!')
        setShowOtpInput(true)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (code: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      })

      if (error) {
        setError(`Verification error: ${error.message}`)
        setLoading(false)
      } else {
        // Successful verification will set the session
        // Redirect to admin or next path
        const next = searchParams.get('next') ?? '/admin'
        setLoading(false)
        router.push(next)
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('An unexpected error occurred during verification.')
      setLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setEmail(value)
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleBackToEmail = () => {
    setShowOtpInput(false)
    setOtpCode('')
    setSuccess(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bright-primary/5 via-white to-bright-third/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="frame-card">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-bright-primary rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground font-primary">
                Admin Access
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                {showOtpInput 
                  ? "Enter the 6-digit code from your email" 
                  : "Enter your email to receive a login code"}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
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

            {!showOtpInput ? (
            <form onSubmit={sendMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => handleInputChange(e.target.value)}
                  required
                    disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                      Send Login Code
                  </>
                )}
              </Button>
            </form>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={(value) => {
                      setOtpCode(value)
                      if (value.length === 6) {
                        handleVerifyOtp(value)
                      }
                    }}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  <p>Didn&apos;t receive a code?</p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal text-bright-primary hover:text-bright-primary/80"
                    onClick={sendMagicLink}
                    disabled={loading}
                  >
                    Resend Code
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleBackToEmail}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Use a different email
                </Button>
              </div>
            )}

            <div className="pt-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secure passwordless authentication</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => router.push('/')}
          >
            ← Back to website
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
} 