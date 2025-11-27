import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { DeleteRestaurantButton } from '../DeleteRestaurantButton'
import { deleteRestaurant } from '@/app/actions/restaurants'

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

// Mock server action
vi.mock('@/app/actions/restaurants', () => ({
  deleteRestaurant: vi.fn(),
}))

// Mock Button component
vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, disabled, isLoading, size, variant }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      data-size={size}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}))

// Mock window.alert
global.alert = vi.fn()

describe('DeleteRestaurantButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render delete button initially', () => {
    render(<DeleteRestaurantButton restaurantId="123" />)

    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
  })

  it('should show confirmation buttons when delete is clicked', () => {
    render(<DeleteRestaurantButton restaurantId="123" />)

    fireEvent.click(screen.getByText('Delete'))

    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })

  it('should hide confirmation when cancel is clicked', () => {
    render(<DeleteRestaurantButton restaurantId="123" />)

    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByText('Confirm')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
  })

  it('should call deleteRestaurant on confirm', async () => {
    (deleteRestaurant as Mock).mockResolvedValue({ success: true })

    render(<DeleteRestaurantButton restaurantId="123" />)

    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Confirm'))

    await waitFor(() => {
      expect(deleteRestaurant).toHaveBeenCalledWith('123')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should refresh router on successful delete', async () => {
    (deleteRestaurant as Mock).mockResolvedValue({ success: true })

    render(<DeleteRestaurantButton restaurantId="123" />)

    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Confirm'))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('should show alert on delete error', async () => {
    (deleteRestaurant as Mock).mockResolvedValue({ error: 'Failed to delete' })

    render(<DeleteRestaurantButton restaurantId="123" />)

    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Confirm'))

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to delete')
    })
  })

  it('should show default error message when error is not provided', async () => {
    (deleteRestaurant as Mock).mockResolvedValue({ error: '' })

    render(<DeleteRestaurantButton restaurantId="123" />)

    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Confirm'))

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to delete restaurant')
    })
  })

  it('should hide confirmation dialog after delete completes', async () => {
    (deleteRestaurant as Mock).mockResolvedValue({ success: true })

    render(<DeleteRestaurantButton restaurantId="123" />)

    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByText('Confirm')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Confirm'))

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument()
    })
  })
})
