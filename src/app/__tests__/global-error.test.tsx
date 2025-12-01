import React from 'react'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
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

  afterEach(() => {
    cleanup()
  })

  it('should render global error page', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    expect(screen.getByText('Application Error')).toBeDefined()
    expect(screen.getByText('A critical error occurred. Please refresh the page.')).toBeDefined()
  })

  it('should call reset when "Refresh" is clicked', () => {
    render(<GlobalError error={mockError} reset={mockReset} />)

    const refreshButton = screen.getByRole('button', { name: 'Refresh' })
    fireEvent.click(refreshButton)

    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('should render with html and body tags', () => {
    const { container } = render(<GlobalError error={mockError} reset={mockReset} />)

    expect(container.querySelector('html')).not.toBeNull()
    expect(container.querySelector('body')).not.toBeNull()
  })
})
