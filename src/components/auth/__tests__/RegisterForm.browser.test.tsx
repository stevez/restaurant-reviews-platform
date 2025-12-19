import React from 'react'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { registerAction } from '@/app/actions/auth'

// Mock next/link - must use React.createElement for browser mode
vi.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return React.createElement('a', { href }, children)
  },
}))

// Import component after mocks are defined
const { RegisterForm } = await import('../RegisterForm')

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
  registerAction: vi.fn(),
}))

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (registerAction as Mock).mockResolvedValue({ success: true });
  })

  it('should render registration form with all fields', async () => {
    await render(<RegisterForm />)

    await expect.element(page.getByLabelText('Name')).toBeVisible()
    await expect.element(page.getByLabelText('Email')).toBeVisible()
    await expect.element(page.getByLabelText('Password')).toBeVisible()
    await expect.element(page.getByLabelText('Role')).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Register' })).toBeVisible()
  })

  it('should render sign in link', async () => {
    await render(<RegisterForm />)

    await expect.element(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  it('should have correct link to login page', async () => {
    await render(<RegisterForm />)

    const signInLink = page.getByRole('link', { name: 'Sign in' })
    await expect.element(signInLink).toHaveAttribute('href', '/login')
  })

  it('should have role dropdown with options', async () => {
    await render(<RegisterForm />)

    const roleSelect = page.getByLabelText('Role')
    await expect.element(roleSelect).toBeVisible()
    // Options are in DOM but not visible until dropdown is opened
    await expect.element(page.getByRole('option', { name: 'Reviewer' })).toBeInTheDocument()
    await expect.element(page.getByRole('option', { name: 'Restaurant Owner' })).toBeInTheDocument()
  })

  it('should show password requirements hint', async () => {
    await render(<RegisterForm />)

    await expect.element(page.getByText(/Must be at least 8 characters/i)).toBeVisible()
  })

  it('should call registerAction with valid data', async () => {
    await render(<RegisterForm />)

    const nameInput = page.getByLabelText('Name')
    const emailInput = page.getByLabelText('Email')
    const passwordInput = page.getByLabelText('Password')
    const roleSelect = page.getByLabelText('Role')
    const submitButton = page.getByRole('button', { name: 'Register' })

    await nameInput.fill('John Doe')
    await emailInput.fill('john@example.com')
    await passwordInput.fill('Password123')
    await roleSelect.selectOptions('OWNER')
    await submitButton.click()

    await vi.waitFor(() => {
      expect(registerAction).toHaveBeenCalledWith('john@example.com', 'Password123', 'John Doe', 'OWNER')
    })
  })

  it('should redirect after successful registration', async () => {
    (registerAction as Mock).mockResolvedValue({ success: true })
    await render(<RegisterForm />)

    const nameInput = page.getByLabelText('Name')
    const emailInput = page.getByLabelText('Email')
    const passwordInput = page.getByLabelText('Password')
    const submitButton = page.getByRole('button', { name: 'Register' })

    await nameInput.fill('John Doe')
    await emailInput.fill('john@example.com')
    await passwordInput.fill('Password123')
    await submitButton.click()

    await vi.waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('should show error message on registration failure', async () => {
    (registerAction as Mock).mockResolvedValue({ error: 'Email already exists' })
    await render(<RegisterForm />)

    const nameInput = page.getByLabelText('Name')
    const emailInput = page.getByLabelText('Email')
    const passwordInput = page.getByLabelText('Password')
    const submitButton = page.getByRole('button', { name: 'Register' })

    await nameInput.fill('John Doe')
    await emailInput.fill('existing@example.com')
    await passwordInput.fill('Password123')
    await submitButton.click()

    await vi.waitFor(async () => {
      await expect.element(page.getByText('Email already exists')).toBeVisible()
    })
  })

  it('should default to REVIEWER role', async () => {
    await render(<RegisterForm />)

    const roleSelect = page.getByLabelText('Role')
    await expect.element(roleSelect).toHaveValue('REVIEWER')
  })

  it('should have email input with correct type', async () => {
    await render(<RegisterForm />)

    const emailInput = page.getByLabelText('Email')
    await expect.element(emailInput).toHaveAttribute('type', 'email')
  })

  it('should have password input with correct type', async () => {
    await render(<RegisterForm />)

    const passwordInput = page.getByLabelText('Password')
    await expect.element(passwordInput).toHaveAttribute('type', 'password')
  })
})
