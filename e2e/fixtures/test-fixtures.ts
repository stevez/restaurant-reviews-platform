import { test as base, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { collectClientCoverage } from 'nextcov/playwright'

const E2E_DB_PORT = 5434

// Cache prisma clients per worker to avoid creating new connections for each test
const workerPrismaClients = new Map<number, PrismaClient>()

function getWorkerPrisma(workerId: number): PrismaClient {
  if (!workerPrismaClients.has(workerId)) {
    workerPrismaClients.set(
      workerId,
      new PrismaClient({
        datasources: {
          db: { url: `postgresql://test:test@localhost:${E2E_DB_PORT}/test_${workerId}` },
        },
      })
    )
  }
  return workerPrismaClients.get(workerId)!
}

export interface TestUser {
  email: string
  password: string
  name: string
}

export interface TestFixtures {
  workerId: string
  testUser: TestUser
  authenticatedPage: void
  db: PrismaClient
  coverage: void
}

export const test = base.extend<TestFixtures>({
  // Auto-reset database before EVERY test
  db: [
    async ({}, use, testInfo) => {
      const workerId = testInfo.parallelIndex
      const prisma = getWorkerPrisma(workerId)

      // Reset database before each test (truncate all tables)
      // Order matters due to foreign key constraints - delete children first
      await prisma.review.deleteMany()
      await prisma.restaurant.deleteMany()
      await prisma.user.deleteMany()

      await use(prisma)
    },
    { auto: true }, // This makes the fixture run for every test automatically
  ],

  workerId: async ({}, use, testInfo) => {
    // Use Playwright's built-in parallelIndex as the worker ID
    const workerId = String(testInfo.parallelIndex)
    await use(workerId)
  },

  testUser: async ({ workerId }, use) => {
    const user: TestUser = {
      email: `test-${workerId}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${workerId}`,
    }
    await use(user)
  },

  authenticatedPage: async ({ page, workerId, testUser }, use) => {
    // Add worker ID header to all requests
    await page.route('**/*', async (route) => {
      const headers = {
        ...route.request().headers(),
        'x-worker-id': workerId,
      }
      await route.continue({ headers })
    })

    // Register and login the test user
    await page.goto('/register')
    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(testUser.email)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByRole('button', { name: /register/i }).click()

    // Wait for redirect to home page
    await expect(page).toHaveURL('/')

    await use()
  },

  // Auto-collect v8 coverage for each test
  coverage: [
    async ({ page }, use, testInfo) => {
      await collectClientCoverage(page, testInfo, use)
    },
    { scope: 'test', auto: true },
  ],
})

export { expect }
