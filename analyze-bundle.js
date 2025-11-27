// Bundle Analyzer Configuration
// To use: Install @next/bundle-analyzer then run: ANALYZE=true npm run build

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer
