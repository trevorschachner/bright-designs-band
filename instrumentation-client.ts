import { getPosthogKey } from "@/lib/env"

// The site's only posthog-js init, kept off the critical path: posthog-js is
// imported (its own chunk) and initialised when the browser is first idle,
// or on the first interaction, whichever comes first. Pageviews come from
// `capture_pageview: 'history_change'`. Development stays untracked.
//
// Session replay is on, but what fraction of sessions is recorded is set in
// PostHog (Project settings > Replay > Sampling), not here. The recorder is a
// separate script PostHog fetches after init, so it is off the critical path
// too. Inputs are masked, and the admin area is wrapped in `ph-no-capture` so
// inquiry details shown there are never recorded.
//
// Trade-off: exceptions thrown before init (the first idle period, at most
// ~2 s) are not captured.

const IDLE_FALLBACK_MS = 2000
const INTERACTIONS = ["pointerdown", "keydown", "scroll"] as const

function startPosthog(posthogKey: string) {
  let started = false
  const start = () => {
    if (started) return
    started = true
    for (const type of INTERACTIONS) window.removeEventListener(type, start)
    void import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(posthogKey, {
          api_host: "/ingest",
          ui_host: "https://us.posthog.com",
          defaults: "2025-05-24",
          capture_pageview: "history_change",
          capture_exceptions: true,
          disable_session_recording: false,
          session_recording: { maskAllInputs: true },
          disable_surveys: true,
          person_profiles: "always",
        })
      })
      .catch((error) => {
        console.error("[PostHog] Failed to initialize:", error)
      })
  }

  for (const type of INTERACTIONS) {
    window.addEventListener(type, start, { once: true, passive: true })
  }
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(start, { timeout: IDLE_FALLBACK_MS })
  } else {
    setTimeout(start, IDLE_FALLBACK_MS)
  }
}

const posthogKey = getPosthogKey()
if (posthogKey && typeof window !== "undefined" && process.env.NODE_ENV !== "development") {
  startPosthog(posthogKey)
}
