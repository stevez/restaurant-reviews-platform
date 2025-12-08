/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable source maps for production builds (needed for v8 coverage)
  productionBrowserSourceMaps: true,
  images: {
    unoptimized: true,
  },
  // Force source maps when running E2E tests
  webpack: (config, { isServer, dev }) => {
    if (process.env.E2E_MODE) {
      if (dev) {
        // In dev mode, use Object.defineProperty to prevent Next.js from overriding devtool
        // This is necessary because Next.js tries to set devtool to 'eval-source-map' in dev mode
        Object.defineProperty(config, 'devtool', {
          get() {
            return 'source-map'
          },
          set() {
            // Ignore attempts to override
          },
        })
      } else {
        // In production, set devtool directly
        config.devtool = 'source-map'
      }

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