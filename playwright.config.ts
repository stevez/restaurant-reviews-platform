import { defineConfig, devices } from '@playwright/test'
import type { NextcovConfig } from 'nextcov'

// Extend Playwright config type to include nextcov
type PlaywrightConfigWithNextcov = Parameters<typeof defineConfig>[0] & {
  nextcov?: NextcovConfig
}

// Nextcov configuration - exported separately since defineConfig strips unknown properties
export const nextcov: NextcovConfig = {
  cdpPort: 9230,
  buildDir: 'dist',
  outputDir: 'coverage/e2e',
  sourceRoot: './src',
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: [
    'src/**/__tests__/**',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}',
    'src/**/*.browser.test.{ts,tsx}',
    'src/**/types/**',
    'src/**/*.css',
  ],
  reporters: ['html', 'lcov', 'json', 'text-summary'],
}

const config: PlaywrightConfigWithNextcov = {
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 4,

  // Use standard Playwright reporters - coverage is handled by our custom processor
  reporter: process.env.CI ? [['github'], ['html']] : [['html']],

  globalTeardown: './e2e/global-teardown.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  nextcov,
}

export default defineConfig(config)
