import { defineConfig, devices } from '@playwright/test'
import type { CoverageReportOptions } from 'monocart-coverage-reports'

// Coverage entry filter configuration (for V8 coverage entries)
const entryFilterConfig = {
  // Include entries matching these URL patterns
  includePatterns: [
    'next/static/chunks',
    'next/server/app',
    'next/server/src',
  ],
  // Exclude entries matching these URL patterns (for client-side chunks)
  excludeChunkPatterns: [/^\d+/], // Vendor/numeric chunks like 878-xxx.js
}

// Coverage source filter configuration
const sourceFilterConfig = {
  // Source path must include one of these patterns
  include: ['src/'],
  // Exclude paths containing any of these patterns
  excludePaths: [
    'src/client/',
    'src/shared/',
    '__tests__',
    '__screenshots__',
  ],
  // Exclude paths matching any of these patterns (substring match)
  excludePatterns: ['.test.'],
  // Exclude files with these extensions
  excludeExtensions: ['.css'],
}

const coverageOptions: CoverageReportOptions = {
  name: 'E2E Coverage',
  outputDir: './coverage/e2e',

  // Include all source files even if they have 0% coverage
  all: './src',

  // Filter entries to only include Next.js app chunks (client and server)
  entryFilter: (entry) => {
    const url = entry.url || ''
    const { includePatterns, excludeChunkPatterns } = entryFilterConfig

    // Check if URL matches any include pattern
    const matchedPattern = includePatterns.find((pattern) => url.includes(pattern))
    if (!matchedPattern) return false

    // For client-side chunks, exclude vendor/numeric chunks
    if (matchedPattern === 'next/static/chunks') {
      const filename = url.split('/').pop() || ''
      if (excludeChunkPatterns.some((pattern) => pattern.test(filename))) {
        return false
      }
    }

    return true
  },

  // Filter sources to focus on app code
  sourceFilter: (sourcePath) => {
    const { include, excludePaths, excludePatterns, excludeExtensions } = sourceFilterConfig
    // Must match at least one include pattern
    if (!include.some((pattern) => sourcePath.includes(pattern))) return false
    // Must not match any exclude path
    if (excludePaths.some((pattern) => sourcePath.includes(pattern))) return false
    // Must not match any exclude pattern
    if (excludePatterns.some((pattern) => sourcePath.includes(pattern))) return false
    // Must not have excluded extension
    if (excludeExtensions.some((ext) => sourcePath.endsWith(ext))) return false
    return true
  },

  // Transform source paths to remove prefixes for cleaner names
  sourcePath: (filePath: string) => {
    // Handle absolute Windows paths from source maps (e.g., C:\...\src\middleware.ts)
    // Convert to relative src/ path to match with 'all' option
    const srcMatch = filePath.match(/[/\\]src[/\\](.+)$/)
    if (srcMatch) {
      return 'src/' + srcMatch[1].replace(/\\/g, '/')
    }

    // Handle webpack prefixes (e.g., _N_E/ from Next.js)
    if (filePath.startsWith('_N_E/')) {
      return filePath.slice(5)
    }
    return filePath
  },

  reports: [
    ['v8'],
    ['console-details'],
    ['lcov'],
  ],
}

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 4,
  reporter: process.env.CI
    ? [['monocart-reporter', { coverage: coverageOptions }], ['github']]
    : [['monocart-reporter', { coverage: coverageOptions }], ['html']],

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
})
