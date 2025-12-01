import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi } from 'vitest'
import { ErrorMessage } from '../ErrorMessage'

describe('ErrorMessage', () => {
  it('should render error message', async () => {
    await render(<ErrorMessage message="An error occurred" />)
    await expect.element(page.getByText('An error occurred')).toBeVisible()
  })

  it('should render error icon', async () => {
    const { container } = await render(<ErrorMessage message="Error" />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('should render retry button when onRetry is provided', async () => {
    const handleRetry = vi.fn()
    await render(<ErrorMessage message="Error" onRetry={handleRetry} />)
    await expect.element(page.getByText('Try again')).toBeVisible()
  })

  it('should not render retry button when onRetry is not provided', async () => {
    await render(<ErrorMessage message="Error" />)
    await expect.element(page.getByText('Try again')).not.toBeInTheDocument()
  })

  it('should call onRetry when retry button is clicked', async () => {
    const handleRetry = vi.fn()
    await render(<ErrorMessage message="Error" onRetry={handleRetry} />)

    await page.getByText('Try again').click()
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', async () => {
    const { container } = await render(<ErrorMessage message="Error" className="custom-class" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.classList.contains('custom-class')).toBe(true)
  })
})
