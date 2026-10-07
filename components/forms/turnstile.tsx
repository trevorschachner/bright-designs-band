"use client"

import Script from "next/script"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { getTurnstileSiteKey } from "@/lib/env"

/**
 * Cloudflare Turnstile widget for forms that post to /api/contact.
 *
 * Uses the explicit render API so React re-renders never mount a second
 * widget: the widget is created once per mounted component and removed on
 * unmount. The parent receives the token through `onToken` (null when it
 * expires or errors) and must call `reset()` after each submission attempt,
 * because a token can be redeemed only once.
 *
 * With no site key (production misconfiguration) this renders nothing and
 * reports an empty token; the server rejects it. Outside production
 * lib/env.ts supplies Cloudflare's always-pass test key instead.
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      "expired-callback"?: () => void
      "error-callback"?: () => void
    }
  ) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export type TurnstileHandle = { reset: () => void }

interface TurnstileProps {
  onToken: (token: string | null) => void
  className?: string
}

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { onToken, className },
  ref
) {
  const siteKey = getTurnstileSiteKey()
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)
  onTokenRef.current = onToken
  const [scriptReady, setScriptReady] = useState(false)

  useImperativeHandle(ref, () => ({
    reset: () => {
      onTokenRef.current(siteKey ? null : "")
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    },
  }), [siteKey])

  useEffect(() => {
    if (!siteKey) onTokenRef.current("")
  }, [siteKey])

  // The script may already be on the page from another mounted form.
  useEffect(() => {
    if (window.turnstile) setScriptReady(true)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!siteKey || !scriptReady || !container || !window.turnstile || widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
    })
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
      widgetIdRef.current = null
    }
  }, [siteKey, scriptReady])

  if (!siteKey) return null

  return (
    <>
      <Script
        id="cf-turnstile-api"
        src={SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={containerRef} className={className} />
    </>
  )
})
