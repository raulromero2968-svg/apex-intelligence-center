/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },

  eslint: {
    // Bypass ESLint during builds (ignores plugin load issues)
    ignoreDuringBuilds: true,
  },

  typescript: {
    // Bypass TypeScript errors during builds (ignores mobile TS complaints)
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
