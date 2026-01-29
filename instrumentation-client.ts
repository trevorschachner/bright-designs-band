import posthog from "posthog-js"

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const isDevelopment = process.env.NODE_ENV === "development";

// Only initialize PostHog in production from this file
// In development, PostHogProvider will handle initialization
if (posthogKey && typeof window !== 'undefined' && !isDevelopment) {
  // Defer initialization to avoid blocking
  setTimeout(() => {
    try {
      posthog.init(posthogKey, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: false,
        person_profiles: 'always',
      });
    } catch (error) {
      console.error('[PostHog] Failed to initialize:', error);
    }
  }, 0);
}
