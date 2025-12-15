const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

/** @type {(phase: string) => import('next').NextConfig} */
module.exports = (phase) => {
  const isE2EMode = process.env.E2E_MODE === 'true'

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    productionBrowserSourceMaps: isE2EMode,
    images: {
      unoptimized: true,
    },
    webpack: (config, { isServer, dev }) => {
      if (isE2EMode) {
        if (dev) {
          // In dev mode, use Object.defineProperty to prevent Next.js from overriding devtool
          Object.defineProperty(config, 'devtool', {
            get() {
              return 'source-map'
            },
            set() {
              // Ignore attempts to override
            },
          })
        } else {
          config.devtool = 'source-map'
        }

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
      ]
    },
  }

  // Use dist for production, .next for dev
  if (phase !== PHASE_DEVELOPMENT_SERVER) {
    return { ...nextConfig, distDir: 'dist' }
  }

  return nextConfig
}
