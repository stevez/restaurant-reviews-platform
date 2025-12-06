/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable source maps for production builds (needed for v8 coverage)
  productionBrowserSourceMaps: true,
  images: {
    unoptimized: true,
  },
  // Force source maps when running with NODE_V8_COVERAGE (E2E tests)
  webpack: (config, { isServer }) => {
    if (process.env.NODE_V8_COVERAGE || process.env.E2E_MODE) {
      // Enable source maps for both client and server
      config.devtool = 'source-map'

      // Disable minification to preserve readable code for coverage
      config.optimization = {
        ...config.optimization,
        minimize: false,
      }

      // For server-side, output source maps alongside the bundles
      if (isServer) {
        config.output = {
          ...config.output,
          devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        }
      }
    }
    return config
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig