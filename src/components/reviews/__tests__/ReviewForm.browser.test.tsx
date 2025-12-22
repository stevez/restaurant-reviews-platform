import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

// Mock server actions
vi.mock('@/app/actions/reviews', () => ({
  createReview: vi.fn(),
  updateReview: vi.fn()
}))

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}))

// Mock the auth module to prevent process.env access
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
  getTokenFromCookies: vi.fn(),
  setTokenCookie: vi.fn(),
  clearTokenCookie: vi.fn(),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Import after mocks
const { default: ReviewForm } = await import('../ReviewForm')
const { createReview, updateReview } = await import('@/app/actions/reviews')

describe('ReviewForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Review Mode', () => {
    it('should render form without existing review', async () => {
      await render(<ReviewForm restaurantId="1" existingReview={null} />)

      await expect.element(page.getByLabelText(/Have you been here/i)).toBeVisible()
      await expect.element(page.getByLabelText('Rating')).toBeVisible()
      await expect.element(page.getByRole('button', { name: /submit review/i })).toBeVisible()
    })

    it('should have default rating of 5', async () => {
      await render(<ReviewForm restaurantId="1" existingReview={null} />)

      const ratingSelect = page.getByLabelText('Rating')
      await expect.element(ratingSelect).toHaveValue('5')
    })

    it('should update comment textarea', async () => {
      await render(<ReviewForm restaurantId="1" existingReview={null} />)

      const commentInput = page.getByPlaceholder('Write your review...')
      await commentInput.fill('Great food!')

      await expect.element(commentInput).toHaveValue('Great food!')
    })

    it('should update rating select', async () => {
      await render(<ReviewForm restaurantId="1" existingReview={null} />)

      const ratingSelect = page.getByLabelText('Rating')
      await ratingSelect.selectOptions('3')

      await expect.element(ratingSelect).toHaveValue('3')
    })

    it('should call createReview on submit', async () => {
      (createReview as Mock).mockResolvedValue({ success: true })

      await render(<ReviewForm restaurantId="1" existingReview={null} />)

      const commentInput = page.getByPlaceholder('Write your review...')
      const ratingSelect = page.getByLabelText('Rating')
      const submitButton = page.getByRole('button', { name: /submit review/i })

      await commentInput.fill('Amazing!')
      await ratingSelect.selectOptions('4')
      await submitButton.click()

      await vi.waitFor(() => {
        expect(createReview).toHaveBeenCalledWith('1', 4, 'Amazing!')
      })
    })

    it('should display error on create failure', async () => {
      (createReview as Mock).mockResolvedValue({ error: 'You have already reviewed this restaurant' })

      await render(<ReviewForm restaurantId="1" existingReview={null} />)

      const submitButton = page.getByRole('button', { name: /submit review/i })
      await submitButton.click()

      await expect.element(page.getByText('You have already reviewed this restaurant')).toBeVisible()
    })

    it('should clear form on successful submit', async () => {
      (createReview as Mock).mockResolvedValue({ success: true })

      await render(<ReviewForm restaurantId="1" existingReview={null} />)

      const commentInput = page.getByPlaceholder('Write your review...')
      const ratingSelect = page.getByLabelText('Rating')

      await commentInput.fill('Great!')
      await ratingSelect.selectOptions('3')
      await page.getByRole('button', { name: /submit review/i }).click()

      await vi.waitFor(async () => {
        await expect.element(commentInput).toHaveValue('')
        await expect.element(ratingSelect).toHaveValue('5')
      })
    })
  })

  describe('Update Review Mode', () => {
    const existingReview = {
      id: 'review-1',
      rating: 4,
      comment: 'Good food'
    }

    it('should render form with existing review data', async () => {
      await render(<ReviewForm restaurantId="1" existingReview={existingReview} />)

      await expect.element(page.getByLabelText(/Update your review/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /update review/i })).toBeVisible()

      const commentInput = page.getByPlaceholder('Write your review...')
      const ratingSelect = page.getByLabelText('Rating')

      await expect.element(commentInput).toHaveValue('Good food')
      await expect.element(ratingSelect).toHaveValue('4')
    })

    it('should call updateReview on submit', async () => {
      (updateReview as Mock).mockResolvedValue({ success: true })

      await render(<ReviewForm restaurantId="1" existingReview={existingReview} />)

      const commentInput = page.getByPlaceholder('Write your review...')
      const submitButton = page.getByRole('button', { name: /update review/i })

      await commentInput.fill('Excellent food!')
      await submitButton.click()

      await vi.waitFor(() => {
        expect(updateReview).toHaveBeenCalledWith('review-1', 4, 'Excellent food!')
      })
    })

    it('should display error on update failure', async () => {
      (updateReview as Mock).mockResolvedValue({ error: 'Unauthorized' })

      await render(<ReviewForm restaurantId="1" existingReview={existingReview} />)

      const submitButton = page.getByRole('button', { name: /update review/i })
      await submitButton.click()

      await expect.element(page.getByText('Unauthorized')).toBeVisible()
    })
  })

  describe('Form Validation', () => {
    it('should have all rating options', async () => {
      const { container } = await render(<ReviewForm restaurantId="1" existingReview={null} />)

      const ratingSelect = container.querySelector('select')!
      const options = ratingSelect.querySelectorAll('option')

      expect(options).toHaveLength(5)
      expect(options[0].textContent).toBe('5')
      expect(options[4].textContent).toBe('1')
    })

    it('should allow empty comment', async () => {
      (createReview as Mock).mockResolvedValue({ success: true })

      await render(<ReviewForm restaurantId="1" existingReview={null} />)

      const submitButton = page.getByRole('button', { name: /submit review/i })
      await submitButton.click()

      await vi.waitFor(() => {
        expect(createReview).toHaveBeenCalledWith('1', 5, undefined)
      })
    })

    it('should disable inputs while submitting', async () => {
      let resolveCreate: any
      (createReview as Mock).mockImplementation(() => new Promise(resolve => { resolveCreate = resolve }))

      await render(<ReviewForm restaurantId="1" existingReview={null} />)

      const submitButton = page.getByRole('button', { name: /submit review/i })

      await submitButton.click()

      // Button text changes to "Submitting..." and should be disabled
      const submittingButton = page.getByRole('button', { name: /submitting/i })
      await expect.element(submittingButton).toBeVisible()
      await expect.element(submittingButton).toBeDisabled()

      // Cleanup
      if (resolveCreate) resolveCreate({ success: true })
    })
  })
})
