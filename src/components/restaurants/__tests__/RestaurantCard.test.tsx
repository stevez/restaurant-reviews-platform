import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RestaurantCard } from '../RestaurantCard'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />
  },
}))

describe('RestaurantCard', () => {
  const mockRestaurant = {
    id: '1',
    title: 'Test Restaurant',
    description: 'A great place to eat',
    location: 'New York, NY',
    cuisine: ['Italian', 'French', 'American'],
    imageUrl: '/test-image.jpg',
    averageRating: 4.5,
    reviewCount: 10,
  }

  it('should render restaurant information', () => {
    render(<RestaurantCard {...mockRestaurant} />)

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    expect(screen.getByText('A great place to eat')).toBeInTheDocument()
    expect(screen.getByText('New York, NY')).toBeInTheDocument()
  })

  it('should render cuisine tags', () => {
    render(<RestaurantCard {...mockRestaurant} />)

    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.getByText('French')).toBeInTheDocument()
    expect(screen.getByText('American')).toBeInTheDocument()
  })

  it('should limit cuisine display to 3 with overflow', () => {
    const restaurantWithManyCuisines = {
      ...mockRestaurant,
      cuisine: ['Italian', 'French', 'American', 'Japanese', 'Chinese'],
    }
    render(<RestaurantCard {...restaurantWithManyCuisines} />)

    expect(screen.getByText('Italian')).toBeInTheDocument()
    expect(screen.getByText('French')).toBeInTheDocument()
    expect(screen.getByText('American')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.queryByText('Japanese')).not.toBeInTheDocument()
  })

  it('should render image', () => {
    render(<RestaurantCard {...mockRestaurant} />)

    const image = screen.getByAltText('Test Restaurant')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test-image.jpg')
  })

  it('should render without image', () => {
    const restaurantWithoutImage = { ...mockRestaurant, imageUrl: null }
    const { container } = render(<RestaurantCard {...restaurantWithoutImage} />)

    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('should display star rating', () => {
    const { container } = render(<RestaurantCard {...mockRestaurant} />)

    const stars = container.querySelectorAll('.material-symbols-outlined')
    expect(stars.length).toBeGreaterThan(0)
  })

  it('should display average rating and review count', () => {
    render(<RestaurantCard {...mockRestaurant} />)

    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('(10 reviews)')).toBeInTheDocument()
  })

  it('should show "No ratings" when averageRating is 0', () => {
    const restaurantWithNoRatings = { ...mockRestaurant, averageRating: 0, reviewCount: 0 }
    render(<RestaurantCard {...restaurantWithNoRatings} />)

    expect(screen.getByText('No ratings')).toBeInTheDocument()
    expect(screen.getByText('(0 reviews)')).toBeInTheDocument()
  })

  it('should link to restaurant details page', () => {
    render(<RestaurantCard {...mockRestaurant} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/reviewer/restaurants/1')
  })

  it('should have hover effect styles', () => {
    const { container } = render(<RestaurantCard {...mockRestaurant} />)

    const card = container.firstChild?.firstChild
    expect(card).toHaveClass('hover:shadow-lg')
  })
})
