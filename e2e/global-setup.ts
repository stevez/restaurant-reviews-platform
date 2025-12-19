/**
 * Global Setup for E2E Tests
 *
 * Starts server-side coverage collection (for dev mode).
 * In production mode, this is a no-op but still called for consistency.
 */

import * as path from 'path'
import { startServerCoverage, loadNextcovConfig } from 'nextcov/playwright'

export default async function globalSetup() {
  const config = await loadNextcovConfig(path.join(process.cwd(), 'playwright.config.ts'))
  await startServerCoverage(config)
}
