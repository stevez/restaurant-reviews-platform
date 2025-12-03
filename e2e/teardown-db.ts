import Docker from 'dockerode'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function teardownDatabase() {
  console.log('\n🧹 Cleaning up...')

  const containerIdFile = path.join(__dirname, '.container-id')

  if (fs.existsSync(containerIdFile)) {
    try {
      const containerId = fs.readFileSync(containerIdFile, 'utf-8').trim()
      const docker = new Docker()
      const container = docker.getContainer(containerId)

      await container.stop()
      await container.remove()
      console.log('✅ PostgreSQL container stopped and removed')
    } catch (error) {
      console.log('Container may have already been removed')
    }

    fs.unlinkSync(containerIdFile)
  }

  console.log('✅ Cleanup complete\n')
}

teardownDatabase().catch((error) => {
  console.error('Failed to teardown database:', error)
  process.exit(1)
})
