import React from 'react'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { loginAction } from '@/app/actions/auth'

// Mock next/link - must use React.createElement for browser mode
vi.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return React.createElement('a', { href }, children)
  },
}))

// Import component after mocks are defined
const { LoginForm } = await import('../LoginForm')

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
  loginAction: vi.fn(),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (loginAction as Mock).mockResolvedValue({ success: true });
  })

  it('should render login form with email and password fields', async () => {
    await render(<LoginForm />)

    await expect.element(page.getByLabelText('Email')).toBeVisible()
    await expect.element(page.getByLabelText('Password')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  it('should render register link', async () => {
    await render(<LoginForm />)

    await expect.element(page.getByRole('link', { name: 'Register' })).toBeVisible()
  })

  it('should have correct link to register page', async () => {
    await render(<LoginForm />)

    const registerLink = page.getByRole('link', { name: 'Register' })
    await expect.element(registerLink).toHaveAttribute('href', '/register')
  })

  it('should call loginAction with valid credentials', async () => {
    await render(<LoginForm />)

    const emailInput = page.getByLabelText('Email')
    const passwordInput = page.getByLabelText('Password')
    const submitButton = page.getByRole('button', { name: 'Sign in' })

    await emailInput.fill('test@example.com')
    await passwordInput.fill('Password123')
    await submitButton.click()

    await vi.waitFor(() => {
      expect(loginAction).toHaveBeenCalledWith('test@example.com', 'Password123')
    })
  })

  it('should redirect after successful login', async () => {
    (loginAction as Mock).mockResolvedValue({ success: true })
    await render(<LoginForm />)

    const emailInput = page.getByLabelText('Email')
    const passwordInput = page.getByLabelText('Password')
    const submitButton = page.getByRole('button', { name: 'Sign in' })

    await emailInput.fill('test@example.com')
    await passwordInput.fill('Password123')
    await submitButton.click()

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('should show error message on login failure', async () => {
    (loginAction as Mock).mockResolvedValue({ error: 'Invalid credentials' })
    await render(<LoginForm />)

    const emailInput = page.getByLabelText('Email')
    const passwordInput = page.getByLabelText('Password')
    const submitButton = page.getByRole('button', { name: 'Sign in' })

    await emailInput.fill('test@example.com')
    await passwordInput.fill('WrongPassword123')
    await submitButton.click()

    await vi.waitFor(async () => {
      await expect.element(page.getByText('Invalid credentials')).toBeVisible()
    })
  })

  it('should have email input with correct type', async () => {
    await render(<LoginForm />)

    const emailInput = page.getByLabelText('Email')
    await expect.element(emailInput).toHaveAttribute('type', 'email')
  })

  it('should have password input with correct type', async () => {
    await render(<LoginForm />)

    const passwordInput = page.getByLabelText('Password')
    await expect.element(passwordInput).toHaveAttribute('type', 'password')
  })
})
