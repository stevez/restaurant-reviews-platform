import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import EditRestaurantPage from '../page'
import { getRestaurant } from '@/app/actions/restaurants'
import { getCurrentUser } from '@/app/actions/auth'
import { notFound } from 'next/navigation'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

// Mock server actions
vi.mock('@/app/actions/restaurants', () => ({
  getRestaurant: vi.fn(),
}))

vi.mock('@/app/actions/auth', () => ({
  getCurrentUser: vi.fn(),
}))

// Mock RestaurantForm component
vi.mock('@/components/restaurants/RestaurantForm', () => ({
  RestaurantForm: ({ mode, restaurantId, initialData }: any) => (
    <div data-testid="restaurant-form">
      <span>Mode: {mode}</span>
      <span>Restaurant ID: {restaurantId}</span>
      <span>Title: {initialData.title}</span>
    </div>
  ),
}))

describe('EditRestaurantPage', () => {
  const mockRestaurant = {
    id: '123',
    title: 'Test Restaurant',
    description: 'Test Description',
    location: 'Test City',
    cuisine: ['Italian', 'French'],
    imageUrl: 'https://example.com/image.jpg',
    ownerId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockUser = {
    id: 'user-123',
    email: 'owner@example.com',
    name: 'Test Owner',
    role: 'OWNER' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render edit restaurant page for owner', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurant);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    const page = await EditRestaurantPage({ params: { id: '123' } })
    render(page)

    expect(screen.getByText('Edit Restaurant')).toBeInTheDocument()
    expect(screen.getByText('Update your restaurant information')).toBeInTheDocument()
    expect(screen.getByTestId('restaurant-form')).toBeInTheDocument()
    expect(screen.getByText('Mode: edit')).toBeInTheDocument()
    expect(screen.getByText('Restaurant ID: 123')).toBeInTheDocument()
    expect(screen.getByText('Title: Test Restaurant')).toBeInTheDocument()
  })

  it('should call notFound when restaurant does not exist', async () => {
    (getRestaurant as Mock).mockResolvedValue(null);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    await expect(EditRestaurantPage({ params: { id: '999' } })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('should call notFound when user is not logged in', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurant);
    (getCurrentUser as Mock).mockResolvedValue(null);

    await expect(EditRestaurantPage({ params: { id: '123' } })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('should call notFound when user is not the owner', async () => {
    (getRestaurant as Mock).mockResolvedValue(mockRestaurant);
    (getCurrentUser as Mock).mockResolvedValue({
      ...mockUser,
      id: 'different-user-id',
    });

    await expect(EditRestaurantPage({ params: { id: '123' } })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('should handle restaurant without imageUrl', async () => {
    const restaurantWithoutImage = { ...mockRestaurant, imageUrl: null };
    (getRestaurant as Mock).mockResolvedValue(restaurantWithoutImage);
    (getCurrentUser as Mock).mockResolvedValue(mockUser);

    const page = await EditRestaurantPage({ params: { id: '123' } })
    render(page)

    expect(screen.getByTestId('restaurant-form')).toBeInTheDocument()
  })
})
