'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/client'
import { getUserRole } from '@/lib/auth/roles'
import { Loader2, AlertCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const nextParam = searchParams.get('next') ?? '/'
    const nextPath = nextParam.startsWith('/') ? nextParam : '/'
    const supabase = createClient()

    const completeExchange = async () => {
      if (!code) {
        setStatus('error')
        setErrorMessage('Missing auth code. Please request a new login link.')
        return
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error || !data?.user) {
        console.error('Auth callback error:', error?.message || 'Unknown error')
        setStatus('error')
        setErrorMessage(error?.message || 'Authentication failed. Please request a new link.')
        return
      }

      const userRole = getUserRole(data.user.email || '')
      const isPrivileged = userRole === 'staff' || userRole === 'admin'
      const isAdminPath = nextPath.startsWith('/admin')

      const targetPath = isPrivileged
        ? (isAdminPath ? nextPath : '/admin')
        : (isAdminPath ? '/' : nextPath)

      router.replace(targetPath)
    }

    completeExchange()
  }, [searchParams, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div>
            <p className="font-medium text-foreground">Completing sign-in…</p>
            <p className="text-sm">Please wait a moment.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 text-center space-y-4">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Authentication Error</h1>
        <p className="text-sm text-muted-foreground">
          {errorMessage ?? 'We were unable to complete your sign-in. Please request a new login link and try again.'}
        </p>
        <button
          onClick={() => router.replace('/login')}
          className="mt-2 inline-flex items-center justify-center rounded-md border border-input bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
        >
          Return to Login
        </button>
      </div>
    </div>
  )
}

