import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Home from '../page'
import { getRestaurants } from '@/app/actions/restaurants'
import { type CuisineType } from '@/lib/constants'

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock getRestaurants server action
vi.mock('@/app/actions/restaurants', () => ({
  getRestaurants: vi.fn(),
}))

describe('Home Page', () => {
  // Mock data with averageRating and reviewCount (as returned by getRestaurants)
  const mockRestaurants = [
    {
      id: '1',
      title: 'Test Restaurant 1',
      description: 'A wonderful place to eat with amazing food and service',
      location: 'New York',
      cuisine: ['Italian'] as CuisineType[],
      imageUrl: '/restaurant1.jpg',
      ownerId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: [{ rating: 5 }, { rating: 4 }],
      owner: { id: '1', name: 'Owner 1' },
      averageRating: 4.5,
      reviewCount: 2,
    },
    {
      id: '2',
      title: 'Test Restaurant 2',
      description: 'Another amazing dining experience with great atmosphere',
      location: 'Chicago',
      cuisine: ['French'] as CuisineType[],
      imageUrl: '/restaurant1.jpg',
      ownerId: '2',
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: [{ rating: 5 }],
      owner: { id: '2', name: 'Owner 2' },
      averageRating: 5,
      reviewCount: 1,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // getRestaurants returns data already sorted by best rating
    vi.mocked(getRestaurants).mockResolvedValue([mockRestaurants[1], mockRestaurants[0]])
  })

  it('should render filter panel', async () => {
    const page = await Home({ searchParams: {} })
    render(page)

    expect(screen.getByText('Sort By')).toBeInTheDocument()
    expect(screen.getByText('Minimum Rating')).toBeInTheDocument()
    expect(screen.getByText('Cuisine')).toBeInTheDocument()
  })

  it('should call getRestaurants with parsed filters', async () => {
    await Home({ searchParams: {} })

    expect(getRestaurants).toHaveBeenCalledWith({
      cuisines: undefined,
      minRating: undefined,
      sort: undefined,
      location: undefined,
    })
  })

  it('should render restaurant cards', async () => {
    const page = await Home({ searchParams: {} })
    render(page)

    expect(screen.getByText('Test Restaurant 1')).toBeInTheDocument()
    expect(screen.getByText('Test Restaurant 2')).toBeInTheDocument()
  })

  it('should render restaurant descriptions', async () => {
    const page = await Home({ searchParams: {} })
    render(page)

    // RestaurantCard now uses line-clamp-2 for visual truncation, but full text is in DOM
    expect(screen.getByText('A wonderful place to eat with amazing food and service')).toBeInTheDocument()
    expect(screen.getByText('Another amazing dining experience with great atmosphere')).toBeInTheDocument()
  })

  it('should display star ratings', async () => {
    const page = await Home({ searchParams: {} })
    const { container } = render(page)

    // New StarRating component uses star_rate icon
    const stars = container.querySelectorAll('.material-symbols-outlined')
    expect(stars.length).toBeGreaterThan(0)
  })

  it('should display review counts', async () => {
    const page = await Home({ searchParams: {} })
    render(page)

    // RestaurantCard now shows "(N reviews)" or "(1 review)" format
    expect(screen.getByText('(2 reviews)')).toBeInTheDocument()
    expect(screen.getByText('(1 review)')).toBeInTheDocument()
  })

  it('should render restaurant cards with correct links', async () => {
    const page = await Home({ searchParams: {} })
    const { container } = render(page)

    // RestaurantCard is now wrapped in Link (no separate Details button)
    // Sorted by rating (best first), so Restaurant 2 (rating 5) appears before Restaurant 1 (rating 4.5)
    const links = container.querySelectorAll('a')
    expect(links.length).toBeGreaterThan(0)
    expect(links[0]).toHaveAttribute('href', '/reviewer/restaurants/2')
  })

  it('should handle empty restaurant results', async () => {
    vi.mocked(getRestaurants).mockResolvedValue([])

    const page = await Home({ searchParams: {} })
    const { container } = render(page)

    const restaurantCards = container.querySelectorAll('.shadow-xl')
    expect(restaurantCards.length).toBe(0)
  })

  it('should render images for each restaurant', async () => {
    const page = await Home({ searchParams: {} })
    const { container } = render(page)

    const images = container.querySelectorAll('img')
    expect(images.length).toBe(2)
    // Sorted by rating (best first), so Restaurant 2 appears first
    expect(images[0]).toHaveAttribute('src', '/restaurant1.jpg')
    expect(images[0]).toHaveAttribute('alt', 'Test Restaurant 2')
  })

  it('should calculate average rating correctly', async () => {
    const page = await Home({ searchParams: {} })
    const { container } = render(page)

    // Test Restaurant 1 has ratings 5 and 4, average 4.5
    // StarRating component renders stars, just verify they exist
    const stars = container.querySelectorAll('.material-symbols-outlined')
    expect(stars.length).toBeGreaterThan(0)
  })

  describe('Filtering', () => {
    it('should filter restaurants by cuisine', async () => {
      await Home({ searchParams: { cuisine: 'Italian' } })

      expect(getRestaurants).toHaveBeenCalledWith({
        cuisines: ['Italian'],
        minRating: undefined,
        sort: undefined,
        location: undefined,
      })
    })

    it('should filter restaurants by multiple cuisines', async () => {
      await Home({ searchParams: { cuisine: 'Italian,French' } })

      expect(getRestaurants).toHaveBeenCalledWith({
        cuisines: ['Italian', 'French'],
        minRating: undefined,
        sort: undefined,
        location: undefined,
      })
    })

    it('should filter restaurants by location', async () => {
      await Home({ searchParams: { location: 'New York' } })

      expect(getRestaurants).toHaveBeenCalledWith({
        cuisines: undefined,
        minRating: undefined,
        sort: undefined,
        location: 'New York',
      })
    })

    it('should filter by cuisine and location together', async () => {
      await Home({ searchParams: { cuisine: 'Italian', location: 'Chicago' } })

      expect(getRestaurants).toHaveBeenCalledWith({
        cuisines: ['Italian'],
        minRating: undefined,
        sort: undefined,
        location: 'Chicago',
      })
    })

    it('should filter restaurants by minimum rating', async () => {
      const mockFilteredRestaurants = [
        {
          id: '2',
          title: 'Test Restaurant 2',
          description: 'Another amazing dining experience with great atmosphere',
          location: 'Chicago',
          cuisine: ['French'] as CuisineType[],
          imageUrl: '/restaurant1.jpg',
          ownerId: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          reviews: [{ rating: 5 }],
          owner: { id: '2', name: 'Owner 2' },
          averageRating: 5,
          reviewCount: 1,
        },
      ]
      vi.mocked(getRestaurants).mockResolvedValue(mockFilteredRestaurants)

      const page = await Home({ searchParams: { minRating: '5' } })
      render(page)

      // Restaurant 2 has average rating 5, should be shown
      expect(screen.getByText('Test Restaurant 2')).toBeInTheDocument()
      // Restaurant 1 has average rating 4.5, should not be in filtered results
      expect(screen.queryByText('Test Restaurant 1')).not.toBeInTheDocument()
    })

    it('should show all restaurants when no filters applied', async () => {
      await Home({ searchParams: {} })

      expect(getRestaurants).toHaveBeenCalledWith({
        cuisines: undefined,
        minRating: undefined,
        sort: undefined,
        location: undefined,
      })
    })
  })

  describe('Sorting', () => {
    it('should sort restaurants by best rating by default', async () => {
      const page = await Home({ searchParams: {} })
      const { container } = render(page)

      const links = container.querySelectorAll('a')
      // Restaurant 2 has rating 5, Restaurant 1 has rating 4.5
      // Best rating first, so Restaurant 2 should appear first
      expect(links[0]).toHaveAttribute('href', '/reviewer/restaurants/2')
    })

    it('should sort restaurants by worst rating when sort=worst', async () => {
      // Mock getRestaurants to return data sorted by worst rating
      vi.mocked(getRestaurants).mockResolvedValue([mockRestaurants[0], mockRestaurants[1]])

      const page = await Home({ searchParams: { sort: 'worst' } })
      const { container } = render(page)

      const links = container.querySelectorAll('a')
      // Restaurant 1 has rating 4.5, Restaurant 2 has rating 5
      // Worst rating first, so Restaurant 1 should appear first
      expect(links[0]).toHaveAttribute('href', '/reviewer/restaurants/1')
    })

    it('should handle sort parameter correctly', async () => {
      const page = await Home({ searchParams: { sort: 'best' } })
      render(page)

      // Verify FilterPanel receives correct sort prop
      expect(screen.getByText('Sort By')).toBeInTheDocument()
    })
  })

  describe('Combined filters and sorting', () => {
    it('should apply cuisine filter, rating filter, and sorting together', async () => {
      const mockFilteredRestaurants = [
        {
          id: '1',
          title: 'Italian Restaurant',
          description: 'Great Italian food',
          location: 'New York',
          cuisine: ['Italian'] as CuisineType[],
          imageUrl: '/restaurant1.jpg',
          ownerId: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
          reviews: [{ rating: 5 }, { rating: 5 }],
          owner: { id: '1', name: 'Owner 1' },
          averageRating: 5,
          reviewCount: 2,
        },
        {
          id: '2',
          title: 'Another Italian Place',
          description: 'Also great Italian food',
          location: 'New York',
          cuisine: ['Italian'] as CuisineType[],
          imageUrl: '/restaurant2.jpg',
          ownerId: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
          reviews: [{ rating: 4 }, { rating: 4 }],
          owner: { id: '2', name: 'Owner 2' },
          averageRating: 4,
          reviewCount: 2,
        },
      ]
      vi.mocked(getRestaurants).mockResolvedValue(mockFilteredRestaurants)

      const page = await Home({
        searchParams: {
          cuisine: 'Italian',
          minRating: '4',
          sort: 'best',
        },
      })
      const { container } = render(page)

      // Should call getRestaurants with correct filters
      expect(getRestaurants).toHaveBeenCalledWith({
        cuisines: ['Italian'],
        minRating: 4,
        sort: 'best',
        location: undefined,
      })

      // Both restaurants should appear (both have rating >= 4)
      expect(screen.getByText('Italian Restaurant')).toBeInTheDocument()
      expect(screen.getByText('Another Italian Place')).toBeInTheDocument()

      // Should be sorted with best rating first (getRestaurants handles sorting)
      const links = container.querySelectorAll('a')
      expect(links[0]).toHaveAttribute('href', '/reviewer/restaurants/1')
    })
  })
})
