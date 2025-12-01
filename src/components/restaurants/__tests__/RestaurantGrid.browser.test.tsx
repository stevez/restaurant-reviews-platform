import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi } from 'vitest'
import { RestaurantGrid } from '../RestaurantGrid'
import { type CuisineType } from '@/lib/constants'

// Mock RestaurantCard
vi.mock('../RestaurantCard', () => ({
  RestaurantCard: ({ title }: any) => <div data-testid="restaurant-card">{title}</div>,
}))

describe('RestaurantGrid', () => {
  const mockRestaurants = [
    {
      id: '1',
      title: 'Restaurant 1',
      description: 'Description 1',
      location: 'Location 1',
      cuisine: ['Italian'] as CuisineType[],
      imageUrl: null,
      averageRating: 4.5,
      reviewCount: 10,
    },
    {
      id: '2',
      title: 'Restaurant 2',
      description: 'Description 2',
      location: 'Location 2',
      cuisine: ['French'] as CuisineType[],
      imageUrl: null,
      averageRating: 4.0,
      reviewCount: 5,
    },
  ]

  it('should render grid of restaurants', async () => {
    await render(<RestaurantGrid restaurants={mockRestaurants} />)

    const cards = page.getByTestId('restaurant-card').all()
    expect(await cards).toHaveLength(2)
  })

  it('should display "No restaurants found" when empty', async () => {
    await render(<RestaurantGrid restaurants={[]} />)

    await expect.element(page.getByText('No restaurants found')).toBeVisible()
    await expect.element(page.getByText('Try adjusting your filters')).toBeVisible()
  })

  it('should use responsive grid layout', async () => {
    const { container } = await render(<RestaurantGrid restaurants={mockRestaurants} />)

    const grid = container.querySelector('.grid')
    expect(grid).not.toBeNull()
    expect(grid!.classList.contains('grid-cols-1')).toBe(true) // Mobile-first
    expect(grid!.classList.contains('md:grid-cols-2')).toBe(true) // Tablet
    expect(grid!.classList.contains('lg:grid-cols-3')).toBe(true) // Desktop
  })

  it('should render all restaurant cards', async () => {
    await render(<RestaurantGrid restaurants={mockRestaurants} />)

    await expect.element(page.getByText('Restaurant 1')).toBeVisible()
    await expect.element(page.getByText('Restaurant 2')).toBeVisible()
  })
})
