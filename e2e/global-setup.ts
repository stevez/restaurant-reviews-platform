import * as fs from 'fs'
import * as path from 'path'

export default async function globalSetup() {
  // Verify the container ID file exists (indicates setup-db ran successfully)
  // Use process.cwd() since Playwright runs from project root
  const containerIdFile = path.join(process.cwd(), 'e2e', '.container-id')

  if (!fs.existsSync(containerIdFile)) {
    throw new Error('Container ID file not found! Run npm run e2e:setup-db first.')
  }

  console.log('\n✅ E2E database ready')
}
