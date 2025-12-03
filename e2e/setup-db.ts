import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Client } from 'pg'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const execAsync = promisify(exec)

const WORKER_COUNT = 4 // Must match workers in playwright.config.ts
const E2E_DB_PORT = 5434 // Fixed port for E2E testing

async function setupDatabase() {
  const startTime = Date.now()
  console.log('\n🐳 Starting PostgreSQL container on port', E2E_DB_PORT, '...')

  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('e2e_test')
    .withUsername('test')
    .withPassword('test')
    .withExposedPorts({ container: 5432, host: E2E_DB_PORT })
    .withReuse()
    .start()

  const baseUrl = `postgresql://${container.getUsername()}:${container.getPassword()}@${container.getHost()}:${E2E_DB_PORT}`

  console.log(`✅ PostgreSQL container started (${Date.now() - startTime}ms)`)

  // Create a database for each worker
  const client = new Client({
    host: container.getHost(),
    port: E2E_DB_PORT,
    user: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  })

  await client.connect()

  for (let i = 0; i < WORKER_COUNT; i++) {
    const dbName = `test_${i}`
    // Drop and recreate database to ensure clean state
    await client.query(`DROP DATABASE IF EXISTS ${dbName}`)
    await client.query(`CREATE DATABASE ${dbName}`)
  }
  console.log(`📦 Created ${WORKER_COUNT} databases (${Date.now() - startTime}ms)`)

  await client.end()

  // Run migrations in parallel
  console.log('🔄 Running migrations...')
  const migrationPromises = []
  for (let i = 0; i < WORKER_COUNT; i++) {
    const dbUrl = `${baseUrl}/test_${i}`
    migrationPromises.push(
      execAsync(`npx prisma db push --skip-generate`, {
        env: { ...process.env, DATABASE_URL: dbUrl },
        cwd: path.join(__dirname, '..'),
      })
    )
  }
  await Promise.all(migrationPromises)

  console.log(`✅ All worker databases ready (${Date.now() - startTime}ms)\n`)

  // Store container ID for teardown
  fs.writeFileSync(
    path.join(__dirname, '.container-id'),
    container.getId()
  )

  console.log('✅ Database setup complete. Container ID:', container.getId())
}

setupDatabase().catch((error) => {
  console.error('Failed to setup database:', error)
  process.exit(1)
})
