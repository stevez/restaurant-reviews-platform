import { test, expect } from './fixtures/test-fixtures'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page, workerId }) => {
    // Add worker ID header to all requests
    await page.route('**/*', async (route) => {
      const headers = {
        ...route.request().headers(),
        'x-worker-id': workerId,
      }
      await route.continue({ headers })
    })
  })

  test('should show sign in and register links when not authenticated', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /register/i })).toBeVisible()
  })

  test('should register a new user', async ({ page, testUser }) => {
    await page.goto('/register')

    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(testUser.email)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByRole('button', { name: /^register$/i }).click()

    // Should redirect to home after registration
    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.getByText(testUser.name)).toBeVisible()
  })

  test('should login with existing user', async ({ page, testUser }) => {
    // First register
    await page.goto('/register')
    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(`login-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()

    // Login
    await page.goto('/login')
    await page.getByLabel('Email').fill(`login-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL('/', { timeout: 10000 })
    await expect(page.getByText(testUser.name)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('nonexistent@example.com')
    await page.getByLabel('Password').fill('WrongPassword123!')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText(/invalid/i)).toBeVisible()
  })

  test('should logout user', async ({ page, testUser }) => {
    // Register first
    await page.goto('/register')
    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(`logout-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: /sign out/i }).click()

    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
    // Use navigation-specific register link
    await expect(page.getByRole('navigation').getByRole('link', { name: /register/i })).toBeVisible()
  })
})
