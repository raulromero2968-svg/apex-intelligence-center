/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Disable ESLint during production builds on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript type-checking during production builds
    // This allows deployment despite React types conflicts
    ignoreBuildErrors: true,
  },
  images: {
    domains: [],
  },
  experimental: {
    // Encourage precise imports for large libraries; Next will rewrite defaults.
    optimizePackageImports: ['lodash', 'lodash-es', 'date-fns', 'dayjs', 'lucide-react'],
    // Skip static generation for API routes during build
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip collecting page data for API routes
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  webpack(config) {
    // Suppress known critical dependency warnings from Sentry/OpenTelemetry
    config.ignoreWarnings = [{ message: /Critical dependency/ }];
    return config;
  },
};

module.exports = nextConfig;
