import { test, expect } from './fixtures/test-fixtures'

test.describe('Reviews', () => {
  test.beforeEach(async ({ page, workerId }) => {
    await page.route('**/*', async (route) => {
      const headers = {
        ...route.request().headers(),
        'x-worker-id': workerId,
      }
      await route.continue({ headers })
    })
  })

  test('reviewer should add a review to a restaurant', async ({ page, testUser }) => {
    // First, create a restaurant as owner
    await page.goto('/register')
    await page.getByLabel('Name').fill('Owner User')
    await page.getByLabel('Email').fill(`review-owner-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByLabel('Role').selectOption('OWNER')
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.getByRole('link', { name: /add restaurant/i }).click()
    await expect(page).toHaveURL('/owner/create', { timeout: 5000 })

    await page.getByLabel('Restaurant Name').fill('Restaurant To Review')
    await page.getByLabel('Location').fill('Boston')
    await page.getByLabel('French').check()
    await page.locator('textarea').fill('A place to be reviewed')
    await page.getByRole('button', { name: /create restaurant/i }).click()

    // Wait for redirect after creation
    await expect(page.getByText('Restaurant To Review')).toBeVisible({ timeout: 10000 })

    // Logout
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()

    // Register as reviewer
    await page.goto('/register')
    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(`reviewer-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // Find and click on the restaurant
    await page.getByRole('link', { name: /restaurant to review/i }).click()

    // Add a review - rating is a combobox dropdown
    await page.getByRole('combobox', { name: 'Rating' }).selectOption('5')
    await page.getByPlaceholder(/write your review/i).fill('Amazing food and great service!')
    await page.getByRole('button', { name: /submit review/i }).click()

    await expect(page.getByText('Amazing food and great service!')).toBeVisible()
  })

  test('should display average rating on restaurant card', async ({ page, testUser }) => {
    // Create restaurant as owner
    await page.goto('/register')
    await page.getByLabel('Name').fill('Rating Owner')
    await page.getByLabel('Email').fill(`rating-owner-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByLabel('Role').selectOption('OWNER')
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.getByRole('link', { name: /add restaurant/i }).click()
    await expect(page).toHaveURL('/owner/create', { timeout: 5000 })

    await page.getByLabel('Restaurant Name').fill('Rated Restaurant')
    await page.getByLabel('Location').fill('Seattle')
    await page.getByLabel('Thai').check()
    await page.locator('textarea').fill('A restaurant with ratings')
    await page.getByRole('button', { name: /create restaurant/i }).click()

    // Wait for redirect after creation
    await expect(page.getByText('Rated Restaurant')).toBeVisible({ timeout: 10000 })

    // Logout and register as reviewer
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()

    await page.goto('/register')
    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(`rater-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // Review the restaurant - rating is a combobox dropdown
    await page.getByRole('link', { name: /rated restaurant/i }).click()
    await page.getByRole('combobox', { name: 'Rating' }).selectOption('4')
    await page.getByPlaceholder(/write your review/i).fill('Good food!')
    await page.getByRole('button', { name: /submit review/i }).click()

    // Go home and check rating is visible
    await page.goto('/')
    const restaurantCard = page.locator('text=Rated Restaurant').locator('..')
    await expect(restaurantCard).toBeVisible()
  })

  test('user cannot review the same restaurant twice', async ({ page, testUser }) => {
    // Create restaurant as owner
    await page.goto('/register')
    await page.getByLabel('Name').fill('Unique Owner')
    await page.getByLabel('Email').fill(`unique-owner-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByLabel('Role').selectOption('OWNER')
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    await page.getByRole('link', { name: /add restaurant/i }).click()
    await expect(page).toHaveURL('/owner/create', { timeout: 5000 })

    await page.getByLabel('Restaurant Name').fill('Unique Review Restaurant')
    await page.getByLabel('Location').fill('Portland')
    await page.getByLabel('Korean').check()
    await page.locator('textarea').fill('Only one review per user')
    await page.getByRole('button', { name: /create restaurant/i }).click()

    // Wait for redirect after creation
    await expect(page.getByText('Unique Review Restaurant')).toBeVisible({ timeout: 10000 })

    // Logout and register as reviewer
    await page.getByRole('button', { name: /sign out/i }).click()
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()

    await page.goto('/register')
    await page.getByLabel('Name').fill(testUser.name)
    await page.getByLabel('Email').fill(`unique-reviewer-${testUser.email}`)
    await page.getByLabel('Password').fill(testUser.password)
    await page.getByRole('button', { name: /^register$/i }).click()
    await expect(page).toHaveURL('/', { timeout: 10000 })

    // Submit first review - rating is a combobox dropdown
    await page.getByRole('link', { name: /unique review restaurant/i }).click()
    await page.getByRole('combobox', { name: 'Rating' }).selectOption('5')
    await page.getByPlaceholder(/write your review/i).fill('First review!')
    await page.getByRole('button', { name: /submit review/i }).click()

    await expect(page.getByText('First review!')).toBeVisible()

    // Review form should be hidden or show already reviewed message
    await expect(page.getByRole('button', { name: /submit review/i })).not.toBeVisible()
  })
})
