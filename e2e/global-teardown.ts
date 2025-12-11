/**
 * Global Teardown for E2E Tests
 *
 * Collects and processes both client-side and server-side coverage.
 */

import * as path from 'path'
import type { FullConfig } from '@playwright/test'
import { finalizeCoverage } from 'nextcov/playwright'
import { loadNextcovConfig } from 'nextcov'

export default async function globalTeardown() {
  // Load config from playwright.config.ts (now in root)
  const config = await loadNextcovConfig(path.join(process.cwd(), 'playwright.config.ts'))

  // Finalize coverage - this handles stopping server coverage collection internally
  await finalizeCoverage(config)
}
