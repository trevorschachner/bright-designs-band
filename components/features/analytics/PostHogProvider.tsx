'use client'

import type { ReactNode } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

/**
 * Makes the posthog-js client available to React (`usePostHog`). It does not
 * initialise PostHog or capture pageviews: instrumentation-client.ts does
 * both, once.
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>
}

export default PostHogProvider
