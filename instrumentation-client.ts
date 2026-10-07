import posthog from "posthog-js"
import { getPosthogKey } from "@/lib/env"

// The site's only posthog-js init. PostHogProvider just hands this client to
// React; pageviews come from `capture_pageview: 'history_change'`, so nothing
// captures `$pageview` by hand. Development stays untracked.
const posthogKey = getPosthogKey();
const isDevelopment = process.env.NODE_ENV === "development";

if (posthogKey && typeof window !== 'undefined' && !isDevelopment) {
  // Defer initialization to avoid blocking
  setTimeout(() => {
    try {
      posthog.init(posthogKey, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: '2025-05-24',
        capture_pageview: 'history_change',
        capture_exceptions: true,
        disable_session_recording: true,
        debug: false,
        person_profiles: 'always',
      });
    } catch (error) {
      console.error('[PostHog] Failed to initialize:', error);
    }
  }, 0);
}
