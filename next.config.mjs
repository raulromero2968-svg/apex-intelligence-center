import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable MDX support
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],

  // Experimental features
  experimental: {
    typedRoutes: false,
    optimizeCss: true, // CSS optimization for better performance
    staleTimes: { dynamic: 0 }, // Keep default; tag invalidation is our lever
    // PPR: Enable when upgrading to Next.js 15+
    // ppr: 'incremental',
  },

  // Ensure SSR on Vercel (no static export)
  output: undefined,

  // Image optimization with remote patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.apexintel.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.apexintel.com',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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

// MDX configuration with remark plugins
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

// Wrap with Sentry for error tracking and performance monitoring
export default withSentryConfig(withMDX(nextConfig), {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
