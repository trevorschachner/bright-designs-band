import { securityHeaders } from './lib/security-headers.mjs';

// Fall back to the production project ref so a missing env var at build time
// degrades to today's behaviour rather than breaking every remote image.
const supabaseHostname = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return 'yibokqolsyxosftcupgz.supabase.co';
  try {
    return new URL(raw).hostname;
  } catch {
    return 'yibokqolsyxosftcupgz.supabase.co';
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly disable Turbopack as we have custom webpack config
  // (though in Next.js 16+ it's default, we can opt out via CLI or just accept the warning if we don't block)
  // But to silence the error, we can add an empty turbopack config if we wanted to use it, OR just remove the eslint key
  
  images: {
    deviceSizes: [640, 1080, 1920],
    formats: ['image/webp'],
    // Derive the Storage host from the same env var the app uses at runtime.
    // Hardcoding one project ref meant any other environment (staging, preview,
    // a restored project) threw on every remote image instead of loading it.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // eslint key is deprecated in Next.js 15+ in favor of 'next lint' command or separate config
  // Removing it to fix build error
  
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
  
  // Custom webpack config (reason why Turbopack might complain if not configured)
  webpack: (config, { isServer }) => {
    // Suppress webpack cache serialization warnings for large strings
    if (!isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /node_modules/,
          message: /Serializing big strings/,
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
