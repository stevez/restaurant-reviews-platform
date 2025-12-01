import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/navigation BEFORE importing the component
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
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

// Import component AFTER mocks
const { FilterPanel } = await import('../FilterPanel')

describe('FilterPanel Browser Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render all filter sections', async () => {
    await render(<FilterPanel />)

    await expect.element(page.getByRole('heading', { name: 'Sort By' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Minimum Rating' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Location' })).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Cuisine' })).toBeVisible()
  })

  it('should render Apply Filters button', async () => {
    await render(<FilterPanel />)

    await expect.element(page.getByRole('button', { name: 'Apply Filters' })).toBeVisible()
  })

  it('should not show Reset button when no filters are active', async () => {
    await render(<FilterPanel />)

    const resetButton = page.getByRole('button', { name: 'Reset Filters' })
    await expect.element(resetButton).not.toBeInTheDocument()
  })

  it('should show Reset button when cuisines are selected', async () => {
    await render(<FilterPanel initialCuisines={['Italian']} />)

    await expect.element(page.getByRole('button', { name: 'Reset Filters' })).toBeVisible()
  })

  it('should render sort options', async () => {
    await render(<FilterPanel />)

    await expect.element(page.getByText('Best Rated')).toBeVisible()
    await expect.element(page.getByText('Worst Rated')).toBeVisible()
  })

  it('should have Best Rated selected by default', async () => {
    await render(<FilterPanel />)

    const bestRatedRadio = page.getByRole('radio', { name: 'Best Rated' })
    await expect.element(bestRatedRadio).toBeChecked()
  })

  it('should change sort order when clicking a different option', async () => {
    await render(<FilterPanel />)

    const worstRatedRadio = page.getByRole('radio', { name: 'Worst Rated' })
    await worstRatedRadio.click()

    await expect.element(worstRatedRadio).toBeChecked()
  })

  it('should render cuisine checkboxes', async () => {
    await render(<FilterPanel />)

    await expect.element(page.getByLabelText('Italian')).toBeVisible()
    await expect.element(page.getByLabelText('Chinese')).toBeVisible()
    await expect.element(page.getByLabelText('Japanese')).toBeVisible()
  })

  it('should toggle cuisine selection when clicking checkbox', async () => {
    await render(<FilterPanel />)

    const italianCheckbox = page.getByLabelText('Italian')
    await expect.element(italianCheckbox).not.toBeChecked()

    await italianCheckbox.click()
    await expect.element(italianCheckbox).toBeChecked()

    await italianCheckbox.click()
    await expect.element(italianCheckbox).not.toBeChecked()
  })

  it('should have initial cuisines pre-selected', async () => {
    await render(<FilterPanel initialCuisines={['Italian', 'Chinese']} />)

    await expect.element(page.getByLabelText('Italian')).toBeChecked()
    await expect.element(page.getByLabelText('Chinese')).toBeChecked()
    await expect.element(page.getByLabelText('Japanese')).not.toBeChecked()
  })

  it('should call router.push when Apply Filters is clicked', async () => {
    await render(<FilterPanel />)

    await page.getByLabelText('Italian').click()
    await page.getByRole('button', { name: 'Apply Filters' }).click()

    expect(mockPush).toHaveBeenCalled()
  })

  it('should save preferences to localStorage when applying filters', async () => {
    await render(<FilterPanel />)

    await page.getByLabelText('Italian').click()
    await page.getByRole('button', { name: 'Apply Filters' }).click()

    const saved = localStorage.getItem('restaurant_filter_preferences')
    expect(saved).not.toBeNull()
    const parsed = JSON.parse(saved!)
    expect(parsed.cuisines).toContain('Italian')
  })

  // Tests for initial values
  it('should render with initial sort order', async () => {
    await render(<FilterPanel initialSort="worst" />)

    const worstRatedRadio = page.getByRole('radio', { name: 'Worst Rated' })
    await expect.element(worstRatedRadio).toBeChecked()
  })

  it('should render with initial minimum rating', async () => {
    await render(<FilterPanel initialMinRating={4} />)

    // First combobox is Minimum Rating, second is Location
    const selects = page.getByRole('combobox').all()
    await expect.element(selects[0]).toHaveValue('4')
  })

  it('should render with initial location', async () => {
    await render(<FilterPanel initialLocation="Chicago" />)

    // First combobox is Minimum Rating, second is Location
    const selects = page.getByRole('combobox').all()
    await expect.element(selects[1]).toHaveValue('Chicago')
  })

  it('should render with all initial values combined', async () => {
    await render(
      <FilterPanel
        initialCuisines={['Italian', 'French']}
        initialMinRating={4}
        initialSort="worst"
        initialLocation="New York"
      />
    )

    await expect.element(page.getByLabelText('Italian')).toBeChecked()
    await expect.element(page.getByLabelText('French')).toBeChecked()
    await expect.element(page.getByRole('radio', { name: 'Worst Rated' })).toBeChecked()

    const selects = page.getByRole('combobox').all()
    await expect.element(selects[0]).toHaveValue('4')
    await expect.element(selects[1]).toHaveValue('New York')
  })

  // Tests for minimum rating select
  it('should change minimum rating when selecting a different value', async () => {
    await render(<FilterPanel />)

    const selects = page.getByRole('combobox').all()
    const ratingSelect = selects[0]
    await expect.element(ratingSelect).toHaveValue('0')

    await ratingSelect.selectOptions('4')
    await expect.element(ratingSelect).toHaveValue('4')
  })

  it('should render all rating options', async () => {
    await render(<FilterPanel />)

    // Check that the rating select has all expected options
    const selects = page.getByRole('combobox').all()
    const ratingSelect = selects[0]

    // Verify we can select different values (proving options exist)
    await ratingSelect.selectOptions('0')
    await expect.element(ratingSelect).toHaveValue('0')
    await ratingSelect.selectOptions('3')
    await expect.element(ratingSelect).toHaveValue('3')
    await ratingSelect.selectOptions('5')
    await expect.element(ratingSelect).toHaveValue('5')
  })

  // Tests for location filter
  it('should change location when selecting a different value', async () => {
    await render(<FilterPanel />)

    const selects = page.getByRole('combobox').all()
    const locationSelect = selects[1]
    await expect.element(locationSelect).toHaveValue('')

    await locationSelect.selectOptions('New York')
    await expect.element(locationSelect).toHaveValue('New York')
  })

  it('should have All Locations as default option', async () => {
    await render(<FilterPanel />)

    await expect.element(page.getByText('All Locations')).toBeVisible()
  })

  it('should show Reset button when minRating is set', async () => {
    await render(<FilterPanel initialMinRating={3} />)

    await expect.element(page.getByRole('button', { name: 'Reset Filters' })).toBeVisible()
  })

  it('should show Reset button when location is set', async () => {
    await render(<FilterPanel initialLocation="Chicago" />)

    await expect.element(page.getByRole('button', { name: 'Reset Filters' })).toBeVisible()
  })

  // Tests for reset functionality
  it('should reset all filters when Reset Filters is clicked', async () => {
    await render(
      <FilterPanel
        initialCuisines={['Italian', 'French']}
        initialMinRating={4}
        initialSort="worst"
        initialLocation="New York"
      />
    )

    await page.getByRole('button', { name: 'Reset Filters' }).click()

    // Check all values are reset
    await expect.element(page.getByLabelText('Italian')).not.toBeChecked()
    await expect.element(page.getByLabelText('French')).not.toBeChecked()
    await expect.element(page.getByRole('radio', { name: 'Best Rated' })).toBeChecked()

    const selects = page.getByRole('combobox').all()
    await expect.element(selects[0]).toHaveValue('0')
    await expect.element(selects[1]).toHaveValue('')
  })

  it('should remove localStorage preferences when Reset Filters is clicked', async () => {
    // Pre-populate localStorage
    localStorage.setItem('restaurant_filter_preferences', JSON.stringify({
      cuisines: ['Italian'],
      minRating: 4,
      sort: 'worst',
      location: 'Chicago'
    }))

    await render(<FilterPanel initialCuisines={['Italian']} />)

    await page.getByRole('button', { name: 'Reset Filters' }).click()

    const saved = localStorage.getItem('restaurant_filter_preferences')
    expect(saved).toBeNull()
  })

  it('should call router.push with empty path when Reset Filters is clicked', async () => {
    await render(<FilterPanel initialCuisines={['Italian']} />)

    await page.getByRole('button', { name: 'Reset Filters' }).click()

    expect(mockPush).toHaveBeenCalledWith('/')
  })

  // Tests for multiple cuisine selections
  it('should handle multiple cuisine selections', async () => {
    await render(<FilterPanel />)

    await page.getByLabelText('Italian').click()
    await page.getByLabelText('French').click()
    await page.getByLabelText('Chinese').click()

    await expect.element(page.getByLabelText('Italian')).toBeChecked()
    await expect.element(page.getByLabelText('French')).toBeChecked()
    await expect.element(page.getByLabelText('Chinese')).toBeChecked()
  })

  it('should render all cuisine types', async () => {
    await render(<FilterPanel />)

    await expect.element(page.getByLabelText('Italian')).toBeVisible()
    await expect.element(page.getByLabelText('French')).toBeVisible()
    await expect.element(page.getByLabelText('Chinese')).toBeVisible()
    await expect.element(page.getByLabelText('Japanese')).toBeVisible()
    await expect.element(page.getByLabelText('Mexican')).toBeVisible()
  })

  // Tests for localStorage loading on mount
  it('should load saved preferences from localStorage on mount', async () => {
    localStorage.setItem('restaurant_filter_preferences', JSON.stringify({
      cuisines: ['Japanese', 'Mexican'],
      minRating: 3,
      sort: 'worst',
      location: 'Los Angeles'
    }))

    await render(<FilterPanel />)

    // Wait for useEffect to run and update state
    await expect.element(page.getByLabelText('Japanese')).toBeChecked()
    await expect.element(page.getByLabelText('Mexican')).toBeChecked()
    await expect.element(page.getByRole('radio', { name: 'Worst Rated' })).toBeChecked()

    const selects = page.getByRole('combobox').all()
    await expect.element(selects[0]).toHaveValue('3')
    await expect.element(selects[1]).toHaveValue('Los Angeles')
  })

  it('should navigate to URL with saved filters on mount', async () => {
    localStorage.setItem('restaurant_filter_preferences', JSON.stringify({
      cuisines: ['Italian'],
      minRating: 4,
      sort: 'best',
      location: 'Chicago'
    }))

    await render(<FilterPanel />)

    // Wait for the navigation to happen
    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })
  })

  it('should not load from localStorage when URL params are present', async () => {
    localStorage.setItem('restaurant_filter_preferences', JSON.stringify({
      cuisines: ['Japanese'],
      minRating: 3,
      sort: 'worst',
      location: 'Los Angeles'
    }))

    // When initialCuisines are provided (simulating URL params), localStorage should be ignored
    await render(<FilterPanel initialCuisines={['Italian']} />)

    // Should show Italian (from URL param), not Japanese (from localStorage)
    await expect.element(page.getByLabelText('Italian')).toBeChecked()
    await expect.element(page.getByLabelText('Japanese')).not.toBeChecked()
  })

  it('should handle invalid JSON in localStorage gracefully', async () => {
    localStorage.setItem('restaurant_filter_preferences', 'invalid-json')

    await render(<FilterPanel />)

    // Should render with defaults, not crash
    await expect.element(page.getByRole('heading', { name: 'Sort By' })).toBeVisible()
    await expect.element(page.getByRole('radio', { name: 'Best Rated' })).toBeChecked()
  })

  it('should handle empty localStorage gracefully', async () => {
    await render(<FilterPanel />)

    // Should render with defaults
    await expect.element(page.getByRole('radio', { name: 'Best Rated' })).toBeChecked()

    const selects = page.getByRole('combobox').all()
    await expect.element(selects[0]).toHaveValue('0')
  })

  // Tests for Apply Filters with all filter types
  it('should include all filter values in URL when applying', async () => {
    await render(<FilterPanel />)

    const selects = page.getByRole('combobox').all()
    await page.getByLabelText('Italian').click()
    await selects[0].selectOptions('4')
    await selects[1].selectOptions('New York')
    await page.getByRole('radio', { name: 'Worst Rated' }).click()

    await page.getByRole('button', { name: 'Apply Filters' }).click()

    expect(mockPush).toHaveBeenCalled()
    const calledUrl = mockPush.mock.calls[mockPush.mock.calls.length - 1][0]
    expect(calledUrl).toContain('cuisine=Italian')
    expect(calledUrl).toContain('minRating=4')
    expect(calledUrl).toContain('location=New+York')
    expect(calledUrl).toContain('sort=worst')
  })

  it('should save all filter values to localStorage when applying', async () => {
    await render(<FilterPanel />)

    const selects = page.getByRole('combobox').all()
    await page.getByLabelText('Italian').click()
    await page.getByLabelText('French').click()
    await selects[0].selectOptions('3')
    await selects[1].selectOptions('Chicago')
    await page.getByRole('radio', { name: 'Worst Rated' }).click()

    await page.getByRole('button', { name: 'Apply Filters' }).click()

    const saved = JSON.parse(localStorage.getItem('restaurant_filter_preferences')!)
    expect(saved.cuisines).toEqual(['Italian', 'French'])
    expect(saved.minRating).toBe(3)
    expect(saved.location).toBe('Chicago')
    expect(saved.sort).toBe('worst')
  })

  it('should navigate to root without params when no filters selected', async () => {
    await render(<FilterPanel />)

    await page.getByRole('button', { name: 'Apply Filters' }).click()

    expect(mockPush).toHaveBeenCalledWith('/?sort=best')
  })
})
