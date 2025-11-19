/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  experimental: {
    // Encourage precise imports for large libraries; Next will rewrite defaults.
    optimizePackageImports: ['lodash', 'lodash-es', 'date-fns', 'dayjs', 'lucide-react'],
  },
  webpack(config) {
    // Suppress known critical dependency warnings from Sentry/OpenTelemetry
    config.ignoreWarnings = [{ message: /Critical dependency/ }];
    return config;
  },
};

module.exports = nextConfig;
