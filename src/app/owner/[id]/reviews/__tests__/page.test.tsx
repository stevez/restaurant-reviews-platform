import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import RestaurantReviewsPage from '../page'
import { getRestaurant } from '@/app/actions/restaurants'
import { getCurrentUser } from '@/app/actions/auth'
import { notFound } from 'next/navigation'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// Mock server actions
vi.mock('@/app/actions/restaurants', () => ({
  getRestaurant: vi.fn(),
}))

vi.mock('@/app/actions/auth', () => ({
  getCurrentUser: vi.fn(),
}))

// Mock UI components
vi.mock('@/components/ui', () => ({
  Button: ({ children, variant, size }: any) => (
    <button data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
  StarRating: ({ rating, size, showRating, reviewCount }: any) => (
    <div data-testid="star-rating">
      {showRating && (
        <>
          <span>{rating > 0 ? rating.toFixed(1) : 'No ratings'}</span>
          {reviewCount !== undefined && (
            <span>({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
          )}
        </>
      )}
    </div>
  ),
}))

describe('RestaurantReviewsPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'owner@example.com',
    name: 'Test Owner',
    role: 'OWNER' as const,
  }

  const mockRestaurantWithReviews = {
    id: '123',
    title: 'Test Restaurant',
    description: 'Test Description',
    location: 'Test City',
    cuisine: ['Italian'],
    imageUrl: 'https://example.com/image.jpg',
    ownerId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    reviews: [
      {
        id: 'review-1',
        rating: 5,
        comment: 'Great food!',
        createdAt: new Date('2024-01-01'),
        user: {
          id: 'reviewer-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
      {
        id: 'review-2',
        rating: 4,
        comment: 'Good service',
        createdAt: new Date('2024-01-02'),
        user: {
          id: 'reviewer-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
      },
    ],
  }

  const mockRestaurantNoReviews = {
    ...mockRestaurantWithReviews,
    reviews: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render restaurant reviews page with reviews', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurantWithReviews);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    const page = await RestaurantReviewsPage({ params: { id: '123' } })
    render(page)

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Customer Reviews')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Great food!')).toBeInTheDocument()
    expect(screen.getByText('Good service')).toBeInTheDocument()
  })

  it('should display average rating correctly', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurantWithReviews);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    const page = await RestaurantReviewsPage({ params: { id: '123' } })
    render(page)

    // Average of 5 and 4 is 4.5
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(2 reviews)')).toBeInTheDocument()
  })

  it('should display no reviews message when restaurant has no reviews', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurantNoReviews);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    const page = await RestaurantReviewsPage({ params: { id: '123' } })
    render(page)

    expect(screen.getByText('No reviews yet')).toBeInTheDocument()
    expect(screen.getByText('Your restaurant will receive reviews from customers')).toBeInTheDocument()
    expect(screen.getByText('No ratings')).toBeInTheDocument()
    expect(screen.getByText('(0 reviews)')).toBeInTheDocument()
  })

  it('should render back button to my restaurants', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurantWithReviews);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    const page = await RestaurantReviewsPage({ params: { id: '123' } })
    render(page)

    expect(screen.getByText('← Back to My Restaurants')).toBeInTheDocument()
  })

  it('should call notFound when restaurant does not exist', async () => {
    (getRestaurant as Mock).mockResolvedValue(null);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    await expect(RestaurantReviewsPage({ params: { id: '999' } })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('should call notFound when user is not logged in', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurantWithReviews);
    (getCurrentUser as Mock).mockResolvedValue(null);

    await expect(RestaurantReviewsPage({ params: { id: '123' } })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('should call notFound when user is not the owner', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurantWithReviews);
    (getCurrentUser as Mock).mockResolvedValue({
      ...mockUser,
      id: 'different-user-id',
    })

    await expect(RestaurantReviewsPage({ params: { id: '123' } })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('should display individual review ratings', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurantWithReviews);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    const page = await RestaurantReviewsPage({ params: { id: '123' } })
    const { container } = render(page)

    // Check that individual ratings are displayed (now shows as decimal like "4.0" or "5.0")
    const ratings = screen.getAllByText(/^[45]\.0$/)
    expect(ratings.length).toBeGreaterThan(0)
  })

  it('should handle review without comment', async () => {
    const restaurantWithCommentlessReview = {
      ...mockRestaurantWithReviews,
      reviews: [
        {
          id: 'review-3',
          rating: 3,
          comment: null,
          createdAt: new Date(),
          user: {
            id: 'reviewer-3',
            name: 'Bob',
            email: 'bob@example.com',
          },
        },
      ],
    };

    (getRestaurant as Mock).mockResolvedValue(restaurantWithCommentlessReview);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    const page = await RestaurantReviewsPage({ params: { id: '123' } })
    render(page)

    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getAllByText('3.0')).toHaveLength(2) // One for average, one for individual review
  })
})
