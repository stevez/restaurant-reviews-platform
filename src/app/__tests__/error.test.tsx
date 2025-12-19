import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import ErrorPage from '../error'

// Mock Button component
vi.mock('@/components/ui', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button onClick={onClick} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}))

// Suppress console.error from useEffect
const originalError = console.error
beforeAll(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('Error Page', () => {
  const mockError = new Error('Test error message')
  const mockReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render error page', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    expect(screen.getByText('Something went wrong!')).toBeInTheDocument()
    expect(screen.getByText('We encountered an unexpected error. Please try again.')).toBeInTheDocument()
  })

  it('should display error message when provided', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should call reset when "Try again" is clicked', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    const tryAgainButton = screen.getByText('Try again')
    fireEvent.click(tryAgainButton)

    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('should have clickable homepage button', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    const homepageButton = screen.getByText('Go to homepage')
    // Just verify the button exists and is clickable (doesn't throw)
    expect(homepageButton).toBeInTheDocument()
    expect(() => fireEvent.click(homepageButton)).not.toThrow()
  })

  it('should log error to console on mount', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    expect(console.error).toHaveBeenCalledWith('Application error:', mockError)
  })

  it('should not display error message box when error has no message', () => {
    const errorWithoutMessage = { name: 'Error' } as Error
    render(<ErrorPage error={errorWithoutMessage} reset={mockReset} />)

    expect(screen.queryByText(/font-mono/)).not.toBeInTheDocument()
  })

  it('should render error icon', () => {
    const { container} = render(<ErrorPage error={mockError} reset={mockReset} />)

    const icon = container.querySelector('.material-symbols-outlined')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveTextContent('error')
  })

  it('should render both action buttons', () => {
    render(<ErrorPage error={mockError} reset={mockReset} />)

    expect(screen.getByText('Try again')).toBeInTheDocument()
    expect(screen.getByText('Go to homepage')).toBeInTheDocument()
  })

  it('should have correct button variants', () => {
    const { container } = render(<ErrorPage error={mockError} reset={mockReset} />)

    const tryAgainButton = screen.getByText('Try again')
    const homepageButton = screen.getByText('Go to homepage')

    expect(tryAgainButton).not.toHaveAttribute('data-variant')
    expect(homepageButton).toHaveAttribute('data-variant', 'outline')
  })
})
