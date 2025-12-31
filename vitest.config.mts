import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    reporters: ['default', ['html', { outputFile: './test-reports/index.html' }]],
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './coverage/combined',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.browser.test.{ts,tsx}',
        'src/types/**',
        'src/**/*.css',
      ],
      reporter: ['text', 'json', 'html'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          pool: 'forks',
          setupFiles: ['./vitest.setup.ts'],
          include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        optimizeDeps: {
          include: ['vitest-browser-react'],
        },
        test: {
          name: 'browser',
          setupFiles: ['./vitest.browser.setup.ts'],
          include: ['src/**/*.browser.test.{ts,tsx}'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            headless: true,
          },
        },
      },
    ],
  },
})
