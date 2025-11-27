import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import RestaurantDetailsPage from '../page'
import { getRestaurant } from '@/app/actions/restaurants'
import { getCurrentUser } from '@/app/actions/auth'
import { getMyReview } from '@/app/actions/reviews'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock server actions
vi.mock('@/app/actions/restaurants', () => ({
  getRestaurant: vi.fn()
}))

vi.mock('@/app/actions/auth', () => ({
  getCurrentUser: vi.fn()
}))

vi.mock('@/app/actions/reviews', () => ({
  getMyReview: vi.fn()
}))

// Mock ReviewForm component
vi.mock('@/components/reviews/ReviewForm', () => ({
  default: ({ restaurantId, existingReview }: any) => (
    <div data-testid="review-form">
      Review Form for {restaurantId}
    </div>
  )
}))

describe('Restaurant Details Page', () => {
  const mockRestaurant = {
    id: '1',
    title: 'Thyme Traveler',
    description: 'Embark on a culinary adventure through time at Thyme Traveler, where every dish is a portal to a different era!',
    location: '7 Wishing Well Way, Hidden Valley, GP 91820',
    cuisine: ['International'],
    imageUrl: '/restaurant1.jpg',
    ownerId: '1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    owner: {
      id: '1',
      name: 'Owner Name'
    },
    reviews: [
      {
        id: '1',
        rating: 5,
        comment: 'Amazing food!',
        restaurantId: '1',
        userId: '1',
        createdAt: new Date('2024-02-22'),
        updatedAt: new Date('2024-02-22'),
        user: {
          id: '1',
          name: 'Jane Doe'
        }
      },
      {
        id: '2',
        rating: 4,
        comment: 'Great experience!',
        restaurantId: '1',
        userId: '2',
        createdAt: new Date('2023-12-24'),
        updatedAt: new Date('2023-12-24'),
        user: {
          id: '2',
          name: 'John Doe'
        }
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (getRestaurant as Mock).mockResolvedValue(mockRestaurant);
    (getCurrentUser as Mock).mockResolvedValue(null);
    (getMyReview as Mock).mockResolvedValue(null)
  })

  it('should render restaurant name', async () => {
    const page = await RestaurantDetailsPage({ params: { id: '1' } })
    render(page)
    
    expect(screen.getByText('Thyme Traveler')).toBeInTheDocument()
  })

  it('should render restaurant location', async () => {
    const page = await RestaurantDetailsPage({ params: { id: '1' } })
    render(page)
    
    expect(screen.getByText(/7 Wishing Well Way/)).toBeInTheDocument()
  })

  it('should render restaurant description', async () => {
    const page = await RestaurantDetailsPage({ params: { id: '1' } })
    render(page)
    
    expect(screen.getByText(/Embark on a culinary adventure/)).toBeInTheDocument()
  })

  it('should render review form when user is reviewer', async () => {
    (getCurrentUser as Mock).mockResolvedValue({
      id: '3',
      email: 'reviewer@example.com',
      name: 'Reviewer User',
      role: 'REVIEWER'
    })

    const page = await RestaurantDetailsPage({ params: { id: '1' } })
    render(page)
    
    expect(screen.getByTestId('review-form')).toBeInTheDocument()
  })

  it('should not render review form when user is not reviewer', async () => {
    (getCurrentUser as Mock).mockResolvedValue({
      id: '1',
      email: 'owner@example.com',
      name: 'Owner User',
      role: 'OWNER'
    })

    const page = await RestaurantDetailsPage({ params: { id: '1' } })
    render(page)
    
    expect(screen.queryByTestId('review-form')).not.toBeInTheDocument()
  })

  it('should render existing reviews', async () => {
    const page = await RestaurantDetailsPage({ params: { id: '1' } })
    render(page)
    
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Amazing food!')).toBeInTheDocument()
    expect(screen.getByText('Great experience!')).toBeInTheDocument()
  })

  it('should render Reviews heading', async () => {
    const page = await RestaurantDetailsPage({ params: { id: '1' } })
    render(page)
    
    expect(screen.getByText('Reviews')).toBeInTheDocument()
  })

  it('should display message when no reviews exist', async () => {
    (getRestaurant as Mock).mockResolvedValue({
      ...mockRestaurant,
      reviews: []
    })

    const page = await RestaurantDetailsPage({ params: { id: '1' } })
    render(page)
    
    expect(screen.getByText(/No reviews yet/)).toBeInTheDocument()
  })

  it('should call getRestaurant with correct id', async () => {
    await RestaurantDetailsPage({ params: { id: '1' } })
    
    expect(getRestaurant).toHaveBeenCalledWith('1')
  })

  it('should fetch current user', async () => {
    await RestaurantDetailsPage({ params: { id: '1' } })
    
    expect(getCurrentUser).toHaveBeenCalled()
  })
})