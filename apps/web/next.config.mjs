import { withSentryConfig } from '@sentry/nextjs';
import { withContentlayer } from 'next-contentlayer';

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
    instrumentationHook: true, // Enable instrumentation.ts for Sentry auto-capture
    // Optimize package imports for large libraries (2025 serverless best practice)
    optimizePackageImports: [
      'langchain',
      '@langchain/core',
      '@langchain/community',
      '@langchain/openai',
      '@langchain/cohere',
      'lucide-react',
      'recharts',
      'framer-motion',
    ],
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

  // No trailing slashes
  trailingSlash: false,

  // PWA headers and service worker configuration
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },

  // Webpack optimizations for serverless bundle size reduction (2025 best practices)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Reduce serverless function bundle size
      config.optimization = {
        ...config.optimization,
        minimize: true,
        // Split large chunks for better serverless cold start
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            langchain: {
              test: /[\\/]node_modules[\\/](@langchain|langchain)[\\/]/,
              name: 'langchain',
              priority: 10,
            },
            openai: {
              test: /[\\/]node_modules[\\/](openai|cohere-ai)[\\/]/,
              name: 'ai-vendors',
              priority: 9,
            },
            default: {
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Exclude heavy dependencies from client bundle when possible
      config.externals = [...(config.externals || []), 'canvas', 'bufferutil', 'utf-8-validate'];
    }

    // Exclude experimental RAG chains from production builds
    // These are located in src/rag/experimental/ and should not be bundled
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /[\\/]src[\\/]rag[\\/]experimental[\\/]/,
      use: 'null-loader',
      // Note: null-loader prevents these files from being bundled
      // Experimental chains are not exported from rag/index.ts barrel
    });

    // Enable tree-shaking for all modules
    config.optimization.usedExports = true;

    return config;
  },
};

// Wrap with Sentry for error tracking and performance monitoring
export default withSentryConfig(withContentlayer(nextConfig), {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
