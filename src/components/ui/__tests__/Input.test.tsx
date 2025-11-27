import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Input } from '../Input'

describe('Input', () => {
  it('should render input field', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should render with label', () => {
    render(<Input label="Email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('should display error message', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })

  it('should display helper text', () => {
    render(<Input helperText="Enter your email address" />)
    expect(screen.getByText('Enter your email address')).toBeInTheDocument()
  })

  it('should not display helper text when error is present', () => {
    render(<Input error="Error message" helperText="Helper text" />)
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('should handle onChange events', async () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    await userEvent.type(input, 'test')

    expect(handleChange).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('should apply custom className', () => {
    render(<Input className="custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })

  it('should set placeholder', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('should have error styling when error prop is set', () => {
    render(<Input error="Error" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('border-red-500')
  })
})
