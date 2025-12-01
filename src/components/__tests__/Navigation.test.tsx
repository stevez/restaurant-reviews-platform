import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { Navigation } from '../Navigation'
import { getCurrentUser } from '@/app/actions/auth'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock getCurrentUser
vi.mock('@/app/actions/auth', () => ({
  getCurrentUser: vi.fn(),
}))

// Mock LogoutButton
vi.mock('@/components/auth/LogoutButton', () => ({
  LogoutButton: () => <button>Sign out</button>,
}))

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when user is not logged in', () => {
    beforeEach(() => {
      (getCurrentUser as Mock).mockResolvedValue(null)
    })

    it('should render app title with link to home', async () => {
      render(await Navigation())

      const titleLink = screen.getByRole('link', { name: 'Restaurant Reviews' })
      expect(titleLink).toBeInTheDocument()
      expect(titleLink).toHaveAttribute('href', '/')
    })

    it('should render Sign in link', async () => {
      render(await Navigation())

      const signInLink = screen.getByRole('link', { name: 'Sign in' })
      expect(signInLink).toBeInTheDocument()
      expect(signInLink).toHaveAttribute('href', '/login')
    })

    it('should render Register link', async () => {
      render(await Navigation())

      const registerLink = screen.getByRole('link', { name: 'Register' })
      expect(registerLink).toBeInTheDocument()
      expect(registerLink).toHaveAttribute('href', '/register')
    })

    it('should not render LogoutButton', async () => {
      render(await Navigation())

      expect(screen.queryByText('Sign out')).not.toBeInTheDocument()
    })

    it('should not render welcome message', async () => {
      render(await Navigation())

      expect(screen.queryByText(/Welcome,/)).not.toBeInTheDocument()
    })
  })

  describe('when user is logged in as OWNER', () => {
    beforeEach(() => {
      (getCurrentUser as Mock).mockResolvedValue({
        id: '1',
        name: 'John Owner',
        email: 'owner@example.com',
        role: 'OWNER',
      })
    })

    it('should render welcome message with user name', async () => {
      render(await Navigation())

      expect(screen.getByText('Welcome,')).toBeInTheDocument()
      expect(screen.getByText('John Owner')).toBeInTheDocument()
    })

    it('should render My Restaurants link', async () => {
      render(await Navigation())

      const myRestaurantsLink = screen.getByRole('link', { name: 'My Restaurants' })
      expect(myRestaurantsLink).toBeInTheDocument()
      expect(myRestaurantsLink).toHaveAttribute('href', '/owner/my-restaurants')
    })

    it('should render Add Restaurant link', async () => {
      render(await Navigation())

      const addRestaurantLink = screen.getByRole('link', { name: 'Add Restaurant' })
      expect(addRestaurantLink).toBeInTheDocument()
      expect(addRestaurantLink).toHaveAttribute('href', '/owner/create')
    })

    it('should render LogoutButton', async () => {
      render(await Navigation())

      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })

    it('should not render Browse Restaurants link', async () => {
      render(await Navigation())

      expect(screen.queryByRole('link', { name: 'Browse Restaurants' })).not.toBeInTheDocument()
    })

    it('should not render Sign in or Register links', async () => {
      render(await Navigation())

      expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Register' })).not.toBeInTheDocument()
    })
  })

  describe('when user is logged in as REVIEWER', () => {
    beforeEach(() => {
      (getCurrentUser as Mock).mockResolvedValue({
        id: '2',
        name: 'Jane Reviewer',
        email: 'reviewer@example.com',
        role: 'REVIEWER',
      })
    })

    it('should render welcome message with user name', async () => {
      render(await Navigation())

      expect(screen.getByText('Welcome,')).toBeInTheDocument()
      expect(screen.getByText('Jane Reviewer')).toBeInTheDocument()
    })

    it('should render Browse Restaurants link', async () => {
      render(await Navigation())

      const browseLink = screen.getByRole('link', { name: 'Browse Restaurants' })
      expect(browseLink).toBeInTheDocument()
      expect(browseLink).toHaveAttribute('href', '/')
    })

    it('should render LogoutButton', async () => {
      render(await Navigation())

      expect(screen.getByText('Sign out')).toBeInTheDocument()
    })

    it('should not render owner-specific links', async () => {
      render(await Navigation())

      expect(screen.queryByRole('link', { name: 'My Restaurants' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Add Restaurant' })).not.toBeInTheDocument()
    })

    it('should not render Sign in or Register links', async () => {
      render(await Navigation())

      expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Register' })).not.toBeInTheDocument()
    })
  })
})
