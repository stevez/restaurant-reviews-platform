import { test, expect } from './fixtures/test-fixtures'

test.describe('Restaurants', () => {
  test.beforeEach(async ({ page, workerId }) => {
    await page.route('**/*', async (route) => {
      const headers = {
        ...route.request().headers(),
        'x-worker-id': workerId,
      }
      await route.continue({ headers })
    })
  })

  test('should display restaurant list on home page', async ({ page }) => {
    await page.goto('/')

    // Check for the main heading (link in navigation)
    await expect(page.getByRole('link', { name: 'Restaurant Reviews' })).toBeVisible()
  })

  test('should filter restaurants by location', async ({ page, testUser }) => {
    // Register as owner to create a restaurant
    await page.goto('/register')
    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(`owner-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByLabel('Role').selectOption('OWNER')
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // Create a restaurant
    await page.getByRole('link', { name: /add restaurant/i }).click()
    await expect(page).toHaveURL('/owner/create', { timeout: 5000 })

    await page.getByLabel('Restaurant Name').fill('Test Restaurant NYC')
    await page.getByLabel('Location').fill('New York')
    // Select cuisine checkboxes
    await page.getByLabel('Italian').check()
    await page.getByLabel('American').check()
    await page.locator('textarea').fill('A great restaurant in New York')
    await page.getByRole('button', { name: /create restaurant/i }).click()

    // Wait for redirect after creation
    await expect(page.getByText('Test Restaurant NYC')).toBeVisible({ timeout: 10000 })

    // Go back to home
    await page.goto('/')

    // Filter by location - the combobox is next to the "Location" heading
    const locationSection = page.getByRole('heading', { name: 'Location' }).locator('..')
    await locationSection.getByRole('combobox').selectOption('New York')

    // Click Apply Filters
    await page.getByRole('button', { name: /apply filters/i }).click()

    await expect(page.getByText('Test Restaurant NYC')).toBeVisible({ timeout: 10000 })
  })

  test('owner should create a restaurant', async ({ page, testUser }) => {
    // Register as owner
    await page.goto('/register')
    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(`create-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByLabel('Role').selectOption('OWNER')
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // Navigate to create restaurant
    await page.getByRole('link', { name: /add restaurant/i }).click()
    await expect(page).toHaveURL('/owner/create', { timeout: 5000 })

    // Fill form with updated field names
    await page.getByLabel('Restaurant Name').fill('My Test Restaurant')
    await page.getByLabel('Location').fill('San Francisco')
    // Select cuisine checkboxes
    await page.getByLabel('Japanese').check()
    await page.locator('textarea').fill('A wonderful place to eat')
    await page.getByRole('button', { name: /create restaurant/i }).click()

    // Should redirect to restaurant page or home
    await expect(page.getByText('My Test Restaurant')).toBeVisible({ timeout: 10000 })
  })

  test('should view restaurant details', async ({ page, testUser }) => {
    // Register as owner and create restaurant
    await page.goto('/register')
    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(`view-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByLabel('Role').selectOption('OWNER')
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.getByRole('link', { name: /add restaurant/i }).click()
    await expect(page).toHaveURL('/owner/create', { timeout: 5000 })

    await page.getByLabel('Restaurant Name').fill('View Details Restaurant')
    await page.getByLabel('Location').fill('Chicago')
    // Select cuisine checkboxes
    await page.getByLabel('Mexican').check()
    await page.locator('textarea').fill('Restaurant for viewing')
    await page.getByRole('button', { name: /create restaurant/i }).click()

    // Wait for redirect after creation - user is now on My Restaurants page
    await expect(page.getByText('View Details Restaurant')).toBeVisible({ timeout: 10000 })

    // Click on View Reviews to see restaurant details
    await page.getByRole('link', { name: /view reviews/i }).click()

    await expect(page.getByText('View Details Restaurant')).toBeVisible()
    await expect(page.getByText('Restaurant for viewing')).toBeVisible()
  })
})
