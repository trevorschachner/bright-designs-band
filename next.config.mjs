import { securityHeaders } from './lib/security-headers.mjs';

// Derive the Storage host from the same env var the app uses at runtime.
// Netlify masks secrets as `****` during the build step, and the build must
// still succeed, so a missing/masked/invalid value warns once and omits the
// Supabase image pattern and CSP origin instead of throwing.
const supabaseHostname = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (raw && raw !== '****') {
    try {
      return new URL(raw).hostname;
    } catch {
      // fall through to the warning
    }
  }
  console.warn(
    '[next.config] NEXT_PUBLIC_SUPABASE_URL is missing, masked or invalid; ' +
      'omitting Supabase remote image pattern and CSP origin.'
  );
  return null;
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    deviceSizes: [640, 1080, 1920],
    formats: ['image/webp'],
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders(supabaseHostname) }];
  },

  async redirects() {
    return [
      { source: '/resources/blog/how-to-choose-a-designer', destination: '/blog/how-to-choose-a-designer', permanent: true },
      { source: '/resources/blog/case-studies', destination: '/blog/case-studies', permanent: true },
      { source: '/resources/blog/case-studies/travelers-rest', destination: '/blog/case-studies/travelers-rest', permanent: true },
      { source: '/resources/blog/case-studies/dorman', destination: '/blog/case-studies/dorman', permanent: true },
      { source: '/resources/blog/case-studies/alpharetta', destination: '/blog/case-studies/alpharetta', permanent: true },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
