import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '../Input'

describe('Input', () => {
  it('should render input field', async () => {
    await render(<Input />)
    await expect.element(page.getByRole('textbox')).toBeVisible()
  })

  it('should render with label', async () => {
    await render(<Input label="Email" />)
    await expect.element(page.getByLabelText('Email')).toBeVisible()
  })

  it('should display error message', async () => {
    await render(<Input error="This field is required" />)
    await expect.element(page.getByText('This field is required')).toBeVisible()
  })

  it('should display helper text', async () => {
    await render(<Input helperText="Enter your email address" />)
    await expect.element(page.getByText('Enter your email address')).toBeVisible()
  })

  it('should not display helper text when error is present', async () => {
    await render(<Input error="Error message" helperText="Helper text" />)
    await expect.element(page.getByText('Helper text')).not.toBeInTheDocument()
    await expect.element(page.getByText('Error message')).toBeVisible()
  })

  it('should handle onChange events', async () => {
    const handleChange = vi.fn()
    await render(<Input onChange={handleChange} />)

    const input = page.getByRole('textbox')
    await input.fill('test')

    expect(handleChange).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', async () => {
    await render(<Input disabled />)
    await expect.element(page.getByRole('textbox')).toBeDisabled()
  })

  it('should apply custom className', async () => {
    await render(<Input className="custom-class" />)
    await expect.element(page.getByRole('textbox')).toHaveClass('custom-class')
  })

  it('should set placeholder', async () => {
    await render(<Input placeholder="Enter text" />)
    await expect.element(page.getByPlaceholder('Enter text')).toBeVisible()
  })

  it('should have error styling when error prop is set', async () => {
    await render(<Input error="Error" />)
    const input = page.getByRole('textbox')
    await expect.element(input).toHaveClass('border-red-500')
  })
})
