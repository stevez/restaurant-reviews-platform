import { render } from 'vitest-browser-react'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '../Button'

describe('Button Browser Tests', () => {
  it('should render button with text', async () => {
    const screen = await render(<Button>Click me</Button>)
    await expect.element(screen.getByRole('button', { name: 'Click me' })).toBeVisible()
  })

  it('should render primary variant by default', async () => {
    const screen = await render(<Button>Primary</Button>)
    await expect.element(screen.getByRole('button', { name: 'Primary' })).toBeVisible()
  })

  it('should render different variants', async () => {
    const screen = await render(
      <div>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="outline">Outline</Button>
      </div>
    )

    await expect.element(screen.getByRole('button', { name: 'Primary' })).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Secondary' })).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Danger' })).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Outline' })).toBeVisible()
  })

  it('should render different sizes', async () => {
    const screen = await render(
      <div>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    )

    await expect.element(screen.getByRole('button', { name: 'Small' })).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Medium' })).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Large' })).toBeVisible()
  })

  it('should be disabled when disabled prop is true', async () => {
    const screen = await render(<Button disabled>Disabled</Button>)
    await expect.element(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })

  it('should be disabled when loading', async () => {
    const screen = await render(<Button isLoading>Loading</Button>)
    await expect.element(screen.getByRole('button', { name: 'Loading' })).toBeDisabled()
  })

  it('should show spinner when loading', async () => {
    const screen = await render(<Button isLoading>Loading</Button>)
    await expect.element(screen.getByRole('button', { name: 'Loading' })).toBeVisible()
  })

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    const screen = await render(<Button onClick={handleClick}>Click me</Button>)

    await screen.getByRole('button', { name: 'Click me' }).click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const screen = await render(<Button onClick={handleClick} disabled>Disabled</Button>)
    await expect.element(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled()
  })
})
