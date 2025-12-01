import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi } from 'vitest'
import { type CuisineType } from '@/lib/constants'
import React from 'react'

// Mock next/link - must use React.createElement for browser mode
vi.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return React.createElement('a', { href }, children)
  },
}))

// Mock next/image - must use React.createElement for browser mode
vi.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    return React.createElement('img', { src, alt })
  },
}))

// Import component after mocks are defined
const { RestaurantCard } = await import('../RestaurantCard')

describe('RestaurantCard', () => {
  const mockRestaurant = {
    id: '1',
    title: 'Test Restaurant',
    description: 'A great place to eat',
    location: 'New York, NY',
    cuisine: ['Italian', 'French', 'American'] as CuisineType[],
    imageUrl: '/test-image.jpg',
    averageRating: 4.5,
    reviewCount: 10,
  }

  it('should render restaurant information', async () => {
    await render(<RestaurantCard {...mockRestaurant} />)

    await expect.element(page.getByText('Test Restaurant')).toBeVisible()
    await expect.element(page.getByText('A great place to eat')).toBeVisible()
    await expect.element(page.getByText('New York, NY')).toBeVisible()
  })

  it('should render cuisine tags', async () => {
    await render(<RestaurantCard {...mockRestaurant} />)

    await expect.element(page.getByText('Italian')).toBeVisible()
    await expect.element(page.getByText('French')).toBeVisible()
    await expect.element(page.getByText('American')).toBeVisible()
  })

  it('should limit cuisine display to 3 with overflow', async () => {
    const restaurantWithManyCuisines = {
      ...mockRestaurant,
      cuisine: ['Italian', 'French', 'American', 'Japanese', 'Chinese'] as CuisineType[],
    }
    await render(<RestaurantCard {...restaurantWithManyCuisines} />)

    await expect.element(page.getByText('Italian')).toBeVisible()
    await expect.element(page.getByText('French')).toBeVisible()
    await expect.element(page.getByText('American')).toBeVisible()
    await expect.element(page.getByText('+2')).toBeVisible()
    await expect.element(page.getByText('Japanese')).not.toBeInTheDocument()
  })

  it('should render image', async () => {
    await render(<RestaurantCard {...mockRestaurant} />)

    const image = page.getByAltText('Test Restaurant')
    await expect.element(image).toBeVisible()
    await expect.element(image).toHaveAttribute('src', '/test-image.jpg')
  })

  it('should render without image', async () => {
    const restaurantWithoutImage = { ...mockRestaurant, imageUrl: null }
    const { container } = await render(<RestaurantCard {...restaurantWithoutImage} />)

    const img = container.querySelector('img')
    expect(img).toBeNull()
  })

  it('should display star rating', async () => {
    const { container } = await render(<RestaurantCard {...mockRestaurant} />)

    const stars = container.querySelectorAll('.material-symbols-outlined')
    expect(stars.length).toBeGreaterThan(0)
  })

  it('should display average rating and review count', async () => {
    await render(<RestaurantCard {...mockRestaurant} />)

    await expect.element(page.getByText('4.5')).toBeVisible()
    await expect.element(page.getByText('(10 reviews)')).toBeVisible()
  })

  it('should show "No ratings" when averageRating is 0', async () => {
    const restaurantWithNoRatings = { ...mockRestaurant, averageRating: 0, reviewCount: 0 }
    await render(<RestaurantCard {...restaurantWithNoRatings} />)

    await expect.element(page.getByText('No ratings')).toBeVisible()
    await expect.element(page.getByText('(0 reviews)')).toBeVisible()
  })

  it('should link to restaurant details page', async () => {
    await render(<RestaurantCard {...mockRestaurant} />)

    const link = page.getByRole('link')
    await expect.element(link).toHaveAttribute('href', '/reviewer/restaurants/1')
  })

  it('should have hover effect styles', async () => {
    const { container } = await render(<RestaurantCard {...mockRestaurant} />)

    const card = container.firstChild?.firstChild as HTMLElement
    expect(card.classList.contains('hover:shadow-lg')).toBe(true)
  })
})
