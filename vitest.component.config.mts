import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  optimizeDeps: {
    include: ['vitest-browser-react'],
  },
  test: {
    globals: true,
    setupFiles: ['./vitest.browser.setup.ts'],
    include: ['src/**/*.browser.test.{ts,tsx}'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reportsDirectory: './coverage/component',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.browser.test.{ts,tsx}',
        'src/types/**',
      ],
      reporter: ['text', 'json', 'html'],
    },
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
  },
})
