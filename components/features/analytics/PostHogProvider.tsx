'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { usePathname, useSearchParams } from 'next/navigation'

let posthogInitialized = false

interface PostHogProviderProps {
  apiKey?: string | null
  apiHost?: string | null
}

export function PostHogProvider({ apiKey, apiHost }: PostHogProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!apiKey || posthogInitialized) {
      return
    }

    posthog.init(apiKey, {
      api_host: apiHost || 'https://app.posthog.com',
      capture_pageview: false,
      autocapture: true,
      disable_session_recording: false,
      person_profiles: 'always',
    })

    posthogInitialized = true
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

export default PostHogProvider

