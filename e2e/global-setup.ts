import * as fs from 'fs'
import * as path from 'path'
import { startServerCoverageAutoDetect, loadNextcovConfig } from 'nextcov'

// CI mode is detected by .container-id file (created by e2e:setup-db)
const containerIdFile = path.join(process.cwd(), 'e2e', '.container-id')
const isCIMode = fs.existsSync(containerIdFile)

export default async function globalSetup() {
  // In CI mode, .container-id exists (created by e2e:setup-db)
  // In dev mode, database and server are manually started
  if (isCIMode) {
    console.log('\n✅ CI mode detected (.container-id exists)')
  } else {
    console.log('\n✅ Dev mode detected (no .container-id)')
  }

  console.log('\n✅ E2E database ready')

  // Load config from playwright.config.ts (now in root)
  const config = await loadNextcovConfig(path.join(process.cwd(), 'playwright.config.ts'))

  // Start server coverage collection with auto-detection (dev vs production mode)
  // Pass the full config to use buildDir, sourceRoot, etc.
  await startServerCoverageAutoDetect(config)
}
