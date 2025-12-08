/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly disable Turbopack as we have custom webpack config
  // (though in Next.js 16+ it's default, we can opt out via CLI or just accept the warning if we don't block)
  // But to silence the error, we can add an empty turbopack config if we wanted to use it, OR just remove the eslint key
  
  images: {
    unoptimized: true,
  },
  // eslint key is deprecated in Next.js 15+ in favor of 'next lint' command or separate config
  // Removing it to fix build error
  
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
