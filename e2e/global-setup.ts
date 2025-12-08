import * as fs from 'fs'
import * as path from 'path'
import { connectToCDP, loadNextcovConfig } from 'nextcov'

export default async function globalSetup() {
  // Verify the container ID file exists (indicates setup-db ran successfully)
  // Use process.cwd() since Playwright runs from project root
  const containerIdFile = path.join(process.cwd(), 'e2e', '.container-id')

  if (!fs.existsSync(containerIdFile)) {
    throw new Error('Container ID file not found! Run npm run e2e:setup-db first.')
  }

  console.log('\n✅ E2E database ready')

  // Load config from playwright.config.ts
  const config = await loadNextcovConfig(path.join(process.cwd(), 'e2e', 'playwright.config.ts'))

  // Connect to server for coverage collection
  console.log('📊 Setting up server coverage...')
  await connectToCDP({ port: config.cdpPort })
}
