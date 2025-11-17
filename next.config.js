/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Experimental features
  experimental: {
    typedRoutes: false, // Set to true if you want typed routes
  },

  // Ensure SSR on Vercel (no static export)
  output: undefined,

  // Image optimization
  images: {
    remotePatterns: [],
    // Add any external image domains here if needed
  },

  // Ensure proper compilation
  swcMinify: true,

  // TypeScript and ESLint config
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // No trailing slashes
  trailingSlash: false,
};

module.exports = nextConfig;
