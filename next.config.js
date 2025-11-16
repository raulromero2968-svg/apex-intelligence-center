/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Experimental features for React 19
  experimental: {
    // Enable if you need React 19 specific features
    // ppr: false, // Partial Prerendering (opt-in for React 19)
  },

  // Image optimization
  images: {
    domains: [],
    // Add any external image domains here if needed
  },

  // Ensure proper compilation
  swcMinify: true,

  // TypeScript and ESLint config
  typescript: {
    // Only use in development - don't ignore errors in production
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
