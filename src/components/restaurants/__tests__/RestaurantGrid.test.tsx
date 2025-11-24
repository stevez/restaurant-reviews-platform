import { render, screen } from '@testing-library/react'
import { RestaurantGrid } from '../RestaurantGrid'

// Mock RestaurantCard
jest.mock('../RestaurantCard', () => ({
  RestaurantCard: ({ title }: any) => <div data-testid="restaurant-card">{title}</div>,
}))

describe('RestaurantGrid', () => {
  const mockRestaurants = [
    {
      id: '1',
      title: 'Restaurant 1',
      description: 'Description 1',
      location: 'Location 1',
      cuisine: ['Italian'],
      imageUrl: null,
      averageRating: 4.5,
      reviewCount: 10,
    },
    {
      id: '2',
      title: 'Restaurant 2',
      description: 'Description 2',
      location: 'Location 2',
      cuisine: ['French'],
      imageUrl: null,
      averageRating: 4.0,
      reviewCount: 5,
    },
  ]

  it('should render grid of restaurants', () => {
    render(<RestaurantGrid restaurants={mockRestaurants} />)

    const cards = screen.getAllByTestId('restaurant-card')
    expect(cards).toHaveLength(2)
  })

  it('should display "No restaurants found" when empty', () => {
    render(<RestaurantGrid restaurants={[]} />)

    expect(screen.getByText('No restaurants found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
  })

  it('should use responsive grid layout', () => {
    const { container } = render(<RestaurantGrid restaurants={mockRestaurants} />)

    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveClass('grid-cols-1') // Mobile-first
    expect(grid).toHaveClass('md:grid-cols-2') // Tablet
    expect(grid).toHaveClass('lg:grid-cols-3') // Desktop
  })

  it('should render all restaurant cards', () => {
    render(<RestaurantGrid restaurants={mockRestaurants} />)

    expect(screen.getByText('Restaurant 1')).toBeInTheDocument()
    expect(screen.getByText('Restaurant 2')).toBeInTheDocument()
  })
})
