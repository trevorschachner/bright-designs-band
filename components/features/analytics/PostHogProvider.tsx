'use client'

import { useEffect, Suspense } from 'react'
import posthog from 'posthog-js'
import { usePathname, useSearchParams } from 'next/navigation'

let posthogInitialized = false

interface PostHogProviderProps {
  apiKey?: string | null
  apiHost?: string | null
}

function PostHogProviderContent({ apiKey, apiHost }: PostHogProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!apiKey || posthogInitialized) {
      return
    }

    try {
      posthog.init(apiKey, {
        api_host: apiHost || 'https://app.posthog.com',
        capture_pageview: false,
        autocapture: true,
        disable_session_recording: false,
        person_profiles: 'always',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('[PostHogProvider] PostHog initialized successfully');
          }
        },
      })

      posthogInitialized = true
    } catch (error) {
      // Silently fail in development, log in production
      if (process.env.NODE_ENV !== 'development') {
        console.error('[PostHogProvider] Failed to initialize:', error);
      }
      // Don't set posthogInitialized to true if init failed
    }
  }, [apiKey, apiHost])

  useEffect(() => {
    if (!apiKey || !posthogInitialized || typeof window === 'undefined') {
      return
    }

    posthog.capture('$pageview', {
      $current_url: window.location.href,
    })
  }, [apiKey, pathname, searchParams])

  return null
}

export function PostHogProvider({ apiKey, apiHost }: PostHogProviderProps) {
  return (
    <Suspense fallback={null}>
      <PostHogProviderContent apiKey={apiKey} apiHost={apiHost} />
    </Suspense>
  )
}

export default PostHogProvider

