import { render, screen } from '@testing-library/react'
import MyRestaurantsPage from '../page'
import { getMyRestaurants } from '@/app/actions/restaurants'

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, fill, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

// Mock server action
jest.mock('@/app/actions/restaurants', () => ({
  getMyRestaurants: jest.fn(),
}))

// Mock UI components
jest.mock('@/components/ui', () => ({
  Button: ({ children, size, variant }: any) => (
    <button data-size={size} data-variant={variant}>
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

// Mock DeleteRestaurantButton
jest.mock('../DeleteRestaurantButton', () => ({
  DeleteRestaurantButton: ({ restaurantId }: any) => (
    <button data-testid={`delete-${restaurantId}`}>Delete</button>
  ),
}))

describe('MyRestaurantsPage', () => {
  const mockRestaurants = [
    {
      id: '1',
      title: 'Italian Place',
      description: 'Best Italian food',
      location: 'New York',
      cuisine: ['Italian', 'Mediterranean'],
      imageUrl: 'https://example.com/italian.jpg',
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: [
        { id: 'r1', rating: 5, comment: 'Great!', createdAt: new Date() },
        { id: 'r2', rating: 4, comment: 'Good', createdAt: new Date() },
      ],
    },
    {
      id: '2',
      title: 'French Bistro',
      description: 'Authentic French cuisine',
      location: 'Paris',
      cuisine: ['French'],
      imageUrl: null,
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      reviews: [],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render my restaurants page with restaurants', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue(mockRestaurants);

    const page = await MyRestaurantsPage()
    render(page)

    expect(screen.getByText('My Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Manage your restaurant listings')).toBeInTheDocument()
    expect(screen.getByText('Italian Place')).toBeInTheDocument()
    expect(screen.getByText('French Bistro')).toBeInTheDocument()
  })

  it('should display restaurant details correctly', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue(mockRestaurants);

    const page = await MyRestaurantsPage()
    render(page)

    expect(screen.getByText('Best Italian food')).toBeInTheDocument()
    expect(screen.getByText('New York')).toBeInTheDocument()
    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.getByText('Mediterranean')).toBeInTheDocument()
  })

  it('should display average ratings correctly', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue(mockRestaurants);

    const page = await MyRestaurantsPage()
    render(page)

    // Italian Place has average rating of 4.5 (5+4)/2
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(2 reviews)')).toBeInTheDocument()

    // French Bistro has no reviews
    expect(screen.getByText('No ratings')).toBeInTheDocument()
    expect(screen.getByText('(0 reviews)')).toBeInTheDocument()
  })

  it('should render action buttons for each restaurant', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue(mockRestaurants);

    const page = await MyRestaurantsPage()
    render(page)

    const editButtons = screen.getAllByText('Edit')
    const deleteButtons = screen.getAllByText('Delete')
    const viewReviewsButtons = screen.getAllByText('View Reviews')

    expect(editButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
    expect(viewReviewsButtons).toHaveLength(2)
  })

  it('should render create new restaurant button', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue(mockRestaurants);

    const page = await MyRestaurantsPage()
    render(page)

    const createButtons = screen.getAllByText('Create New Restaurant')
    expect(createButtons.length).toBeGreaterThan(0)
  })

  it('should display empty state when no restaurants exist', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue([]);

    const page = await MyRestaurantsPage()
    render(page)

    expect(screen.getByText("You haven't created any restaurants yet")).toBeInTheDocument()
    expect(screen.getByText('Create Your First Restaurant')).toBeInTheDocument()
  })

  it('should render restaurant image when available', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue(mockRestaurants);

    const page = await MyRestaurantsPage()
    const { container } = render(page)

    const images = container.querySelectorAll('img')
    expect(images.length).toBe(1) // Only Italian Place has an image
    expect(images[0]).toHaveAttribute('src', 'https://example.com/italian.jpg')
    expect(images[0]).toHaveAttribute('alt', 'Italian Place')
  })

  it('should not render image container when imageUrl is null', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue([mockRestaurants[1]]);

    const page = await MyRestaurantsPage()
    const { container } = render(page)

    const images = container.querySelectorAll('img')
    expect(images.length).toBe(0)
  })

  it('should display cuisine tags for each restaurant', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue(mockRestaurants);

    const page = await MyRestaurantsPage()
    render(page)

    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.getByText('Mediterranean')).toBeInTheDocument()
    expect(screen.getByText('French')).toBeInTheDocument()
  })

  it('should render correct links for edit and view reviews', async () => {
    (getMyRestaurants as jest.Mock).mockResolvedValue([mockRestaurants[0]]);

    const page = await MyRestaurantsPage()
    const { container } = render(page)

    const links = container.querySelectorAll('a')
    const editLink = Array.from(links).find((link) => link.getAttribute('href') === '/owner/1/edit')
    const reviewsLink = Array.from(links).find(
      (link) => link.getAttribute('href') === '/owner/1/reviews'
    )

    expect(editLink).toBeTruthy()
    expect(reviewsLink).toBeTruthy()
  })

  it('should calculate ratings for restaurants with multiple reviews', async () => {
    const restaurantWithManyReviews = {
      ...mockRestaurants[0],
      reviews: [
        { id: 'r1', rating: 5, comment: 'Excellent', createdAt: new Date() },
        { id: 'r2', rating: 5, comment: 'Amazing', createdAt: new Date() },
        { id: 'r3', rating: 4, comment: 'Good', createdAt: new Date() },
        { id: 'r4', rating: 3, comment: 'Okay', createdAt: new Date() },
      ],
    };

    (getMyRestaurants as jest.Mock).mockResolvedValue([restaurantWithManyReviews]);

    const page = await MyRestaurantsPage()
    render(page)

    // Average: (5+5+4+3)/4 = 4.25
    expect(screen.getByText('4.3')).toBeInTheDocument()
    expect(screen.getByText('(4 reviews)')).toBeInTheDocument()
  })
})
