# Playwright E2E Testing Integration

## Overview

E2E testing setup using:
- **Playwright** for browser automation
- **Testcontainers** for PostgreSQL database lifecycle
- **4 parallel workers** with per-worker database isolation
- **Auto-reset** database before each test
- **Direct Prisma access** for test data seeding

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│              PostgreSQL Container (port 5434)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  test_0  │  │  test_1  │  │  test_2  │  │  test_3  │       │
└────────────────────────────────────────────────────────────────┘
         ↑              ↑              ↑              ↑
         │              │              │              │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
    │Worker 0 │    │Worker 1 │    │Worker 2 │    │Worker 3 │
    │X-Worker │    │X-Worker │    │X-Worker │    │X-Worker │
    │-Id: 0   │    │-Id: 1   │    │-Id: 2   │    │-Id: 3   │
    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │              │
         └──────────────┴──────────────┴──────────────┘
                                │
                    ┌───────────────────────┐
                    │   Next.js:3000        │
                    │                       │
                    │   getPrisma() routes  │
                    │   based on            │
                    │   X-Worker-Id header  │
                    └───────────────────────┘
```

**How it works:**
1. Each Playwright worker sends `X-Worker-Id` header with every request
2. `getPrisma()` in `src/lib/db.ts` reads the header and returns the appropriate PrismaClient
3. Each worker's requests go to its own isolated database
4. Database is auto-reset before each test via `{ auto: true }` fixture
5. Tests can seed data directly via `db` fixture (Prisma client)

## Project Structure

```
e2e/
├── playwright.config.ts      # 4 workers, global setup/teardown
├── setup-db.ts               # Start container + create databases
├── teardown-db.ts            # Stop container
├── global-setup.ts           # Verify DB ready
├── global-teardown.ts        # Cleanup check
├── fixtures/
│   └── test-fixtures.ts      # db, workerId, testUser fixtures
├── auth.spec.ts              # 5 authentication tests
├── restaurants.spec.ts       # 4 restaurant tests
└── reviews.spec.ts           # 3 review tests
```

## Key Files

### src/lib/db.ts
Routes database connections based on `X-Worker-Id` header when `E2E_MODE=true`:

```typescript
export function getPrisma(): PrismaClient {
  if (process.env.E2E_MODE === 'true') {
    const headersList = headers()
    const workerId = headersList.get('x-worker-id')
    if (workerId) {
      return getWorkerClient(workerId) // Returns client for test_{workerId}
    }
  }
  return getDefaultClient()
}
```

### e2e/fixtures/test-fixtures.ts
Provides fixtures for all tests:

```typescript
export const test = base.extend<TestFixtures>({
  // Auto-reset database before EVERY test
  db: [
    async ({}, use, testInfo) => {
      const prisma = getWorkerPrisma(testInfo.parallelIndex)

      // Truncate all tables
      await prisma.review.deleteMany()
      await prisma.restaurant.deleteMany()
      await prisma.user.deleteMany()

      await use(prisma)
    },
    { auto: true },
  ],

  workerId: async ({}, use, testInfo) => {
    await use(String(testInfo.parallelIndex))
  },

  testUser: async ({ workerId }, use) => {
    await use({
      email: `test-${workerId}@example.com`,
      password: 'TestPassword123!',
      name: `Test User ${workerId}`,
    })
  },
})
```

### e2e/playwright.config.ts
```typescript
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  workers: process.env.CI ? 4 : 4,
  retries: process.env.CI ? 2 : 0,
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  // ...
})
```

## NPM Scripts

```json
{
  "e2e": "npm run e2e:setup-db && npm run e2e:run && npm run e2e:teardown-db",
  "e2e:setup-db": "npx ts-node e2e/setup-db.ts",
  "e2e:run": "start-server-and-test start:e2e http-get://localhost:3000 playwright-test",
  "e2e:teardown-db": "npx ts-node e2e/teardown-db.ts",
  "start:e2e": "cross-env E2E_MODE=true DATABASE_URL_BASE=postgresql://test:test@localhost:5434 next start",
  "playwright-test": "playwright test --config=e2e/playwright.config.ts"
}
```

## Running E2E Tests

```bash
# Full run (setup → tests → teardown)
npm run e2e

# Individual steps
npm run e2e:setup-db    # Start container, create DBs
npm run e2e:run         # Start server + run tests
npm run e2e:teardown-db # Stop container
```

## Test Suites (12 tests)

### auth.spec.ts (5 tests)
- Show sign in/register links when not authenticated
- Register new user
- Login with existing user
- Show error for invalid credentials
- Logout user

### restaurants.spec.ts (4 tests)
- Display restaurant list on home page
- Filter restaurants by location
- Owner creates a restaurant
- View restaurant details

### reviews.spec.ts (3 tests)
- Reviewer adds a review
- Display average rating on restaurant card
- User cannot review same restaurant twice

## Writing Tests

### Basic test with clean database
```typescript
test('example test', async ({ page, testUser }) => {
  // Database is already empty (auto-reset)
  await page.goto('/register')
  await page.getByLabel('Email').fill(testUser.email)
  // ...
})
```

### Test with seeded data
```typescript
test('test with pre-seeded data', async ({ page, db }) => {
  // Seed via Prisma directly
  const user = await db.user.create({
    data: { name: 'Test', email: 'test@example.com', password: 'hashed...', role: 'OWNER' }
  })
  const restaurant = await db.restaurant.create({
    data: { name: 'Test Restaurant', ownerId: user.id, ... }
  })

  // Now test the UI
  await page.goto('/')
  await expect(page.getByText('Test Restaurant')).toBeVisible()
})
```

### Adding worker ID header (done in beforeEach)
```typescript
test.beforeEach(async ({ page, workerId }) => {
  await page.route('**/*', async (route) => {
    const headers = {
      ...route.request().headers(),
      'x-worker-id': workerId,
    }
    await route.continue({ headers })
  })
})
```

## CI Integration

The `.github/workflows/ci.yml` includes an `e2e` job that:
1. Builds the application
2. Runs `npm run e2e`
3. Uploads Playwright report on failure

## Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "^1.49.1",
    "@testcontainers/postgresql": "^10.18.0",
    "testcontainers": "^10.18.0",
    "start-server-and-test": "^2.0.9",
    "cross-env": "^7.0.3",
    "pg": "^8.13.1"
  }
}
```

## Notes

- **Port 5434**: E2E PostgreSQL container uses fixed port 5434 (dev uses 5433)
- **`.withReuse()`**: Container persists between runs for faster iteration
- **Auto-reset**: Every test starts with empty database via `{ auto: true }` fixture
- **Parallel safety**: Tests use unique email prefixes to avoid conflicts
- **Direct seeding**: Use `db` fixture to seed data without UI interaction
