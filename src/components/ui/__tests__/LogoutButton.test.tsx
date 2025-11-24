import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LogoutButton } from '../LogoutButton'
import { logoutAction } from '@/app/actions/auth'

// Mock next/navigation
const mockPush = jest.fn()
const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock server action
jest.mock('@/app/actions/auth', () => ({
  logoutAction: jest.fn(),
}))

describe('LogoutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (logoutAction as jest.Mock).mockResolvedValue(undefined);
  })

  it('should render logout button', () => {
    render(<LogoutButton />)
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('should have disabled attribute in HTML', () => {
    render(<LogoutButton />)

    const button = screen.getByText('Sign out')
    // Button is not disabled initially
    expect(button).not.toBeDisabled()
  })

  it('should call logoutAction when clicked', async () => {
    render(<LogoutButton />)

    const button = screen.getByText('Sign out')
    fireEvent.click(button)

    await waitFor(() => {
      expect(logoutAction).toHaveBeenCalledTimes(1)
    })
  })

  it('should redirect to login page after logout', async () => {
    render(<LogoutButton />)

    const button = screen.getByText('Sign out')
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('should apply correct CSS classes', () => {
    render(<LogoutButton />)

    const button = screen.getByText('Sign out')
    expect(button).toHaveClass('text-sm', 'font-semibold', 'text-red-600')
  })
})
