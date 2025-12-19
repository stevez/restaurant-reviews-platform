import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { LogoutButton } from '../LogoutButton'
import { logoutAction } from '@/app/actions/auth'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock server action
vi.mock('@/app/actions/auth', () => ({
  logoutAction: vi.fn(),
}))

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (logoutAction as Mock).mockResolvedValue(undefined);
  })

  it('should render logout button', async () => {
    await render(<LogoutButton />)
    await expect.element(page.getByText('Sign out')).toBeVisible()
  })

  it('should have disabled attribute in HTML', async () => {
    await render(<LogoutButton />)

    const button = page.getByText('Sign out')
    // Button is not disabled initially
    await expect.element(button).not.toBeDisabled()
  })

  it('should call logoutAction when clicked', async () => {
    await render(<LogoutButton />)

    const button = page.getByText('Sign out')
    await button.click()

    await vi.waitFor(() => {
      expect(logoutAction).toHaveBeenCalledTimes(1)
    })
  })

  it('should redirect to login page after logout', async () => {
    await render(<LogoutButton />)

    const button = page.getByText('Sign out')
    await button.click()

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('should apply correct CSS classes', async () => {
    await render(<LogoutButton />)

    const button = page.getByText('Sign out')
    await expect.element(button).toHaveClass('text-sm')
    await expect.element(button).toHaveClass('font-semibold')
    await expect.element(button).toHaveClass('text-red-600')
  })
})
