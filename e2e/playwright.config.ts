import { defineConfig, devices } from '@playwright/test'
import type { NextcovConfig } from 'nextcov'

// Extend Playwright config type to include nextcov
type PlaywrightConfigWithNextcov = Parameters<typeof defineConfig>[0] & {
  nextcov?: NextcovConfig
}

const config: PlaywrightConfigWithNextcov = {
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 4,

  // Use standard Playwright reporters - coverage is handled by our custom processor
  reporter: process.env.CI ? [['github'], ['html']] : [['html']],

  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

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

  // Nextcov configuration for E2E coverage collection
  nextcov: {
    cdpPort: 9230,
    buildDir: '.next',
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
  },
}

export default defineConfig(config)
