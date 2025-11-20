/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Skip type checking and ESLint during build for now
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Suppress webpack cache serialization warnings for large strings
    // This is a performance suggestion, not an error, and using Buffer isn't practical here
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
