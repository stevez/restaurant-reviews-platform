import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
import GlobalError from '../global-error'

// Suppress console.error for expected DOM nesting warning
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('validateDOMNesting')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

describe('Global Error Page', () => {
  const mockError = new Error('Critical error')
  const mockReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render global error page', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    expect(screen.getByText('Application Error')).toBeInTheDocument()
    expect(screen.getByText('A critical error occurred. Please refresh the page.')).toBeInTheDocument()
  })

  it('should call reset when "Refresh" is clicked', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)

    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('should render with html and body tags', () => {
    const { container } = render(<GlobalError error={mockError} reset={mockReset} />)

    expect(container.querySelector('html')).toBeInTheDocument()
    expect(container.querySelector('body')).toBeInTheDocument()
  })
})
