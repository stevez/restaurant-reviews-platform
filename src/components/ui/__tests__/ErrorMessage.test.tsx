import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ErrorMessage } from '../ErrorMessage'

describe('ErrorMessage', () => {
  it('should render error message', () => {
    render(<ErrorMessage message="An error occurred" />)
    expect(screen.getByText('An error occurred')).toBeInTheDocument()
  })

  it('should render error icon', () => {
    const { container } = render(<ErrorMessage message="Error" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should render retry button when onRetry is provided', () => {
    const handleRetry = vi.fn()
    render(<ErrorMessage message="Error" onRetry={handleRetry} />)
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error" />)
    expect(screen.queryByText('Try again')).not.toBeInTheDocument()
  })

  it('should call onRetry when retry button is clicked', async () => {
    const handleRetry = vi.fn()
    render(<ErrorMessage message="Error" onRetry={handleRetry} />)

    await userEvent.click(screen.getByText('Try again'))
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', () => {
    const { container } = render(<ErrorMessage message="Error" className="custom-class" />)
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-class')
  })
})
