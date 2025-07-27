'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Mail, Loader2, Music } from 'lucide-react'
import Link from 'next/link'

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token and type from URL params
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (!token_hash || !type) {
          setStatus('error')
          setMessage('Invalid confirmation link. Please check your email and try again.')
          return
        }

        // Verify the email confirmation
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any
        })

        if (error) {
          setStatus('error')
          setMessage(error.message || 'Failed to confirm email. Please try again.')
        } else {
          setStatus('success')
          setMessage('Your email has been confirmed! You can now sign in to your account.')
          
          // Redirect to login after a short delay
          setTimeout(() => {
            router.push('/login')
          }, 3000)
        }
      } catch (error) {
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleEmailConfirmation()
  }, [searchParams, supabase.auth, router])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'error':
        return <XCircle className="w-8 h-8 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
    }
  }

  const getMessageColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-800'
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
    }
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
                Email Confirmation
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                {status === 'loading' && "Verifying your email address..."}
                {status === 'success' && "Welcome to Bright Designs!"}
                {status === 'error' && "Confirmation Failed"}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className={getStatusColor()}>
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <AlertDescription className={getMessageColor()}>
                  {message || "Please wait while we confirm your email address..."}
                </AlertDescription>
              </div>
            </Alert>

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <Mail className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-800 font-medium">Account Verified!</p>
                  <p className="text-xs text-green-700 mt-1">
                    You'll be redirected to the login page in a few seconds.
                  </p>
                </div>
                <Button className="w-full" asChild>
                  <Link href="/login">
                    Continue to Sign In
                  </Link>
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-red-800 font-medium">Verification Failed</p>
                  <p className="text-xs text-red-700 mt-1">
                    The confirmation link may have expired or been used already.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button className="w-full" asChild>
                    <Link href="/login">
                      Try Signing In
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">
                      Request New Verification
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  This may take a few moments...
                </p>
              </div>
            )}
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