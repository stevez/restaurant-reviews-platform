import { render } from 'vitest-browser-react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

// Mock next/image - must be a proper React component
vi.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    return React.createElement('img', { src, alt, 'data-testid': 'next-image' })
  },
}))

// Mock the server action
const mockUploadImageAction = vi.fn()
vi.mock('@/app/actions/restaurants', () => ({
  uploadImageAction: (formData: FormData) => mockUploadImageAction(formData),
}))

// Mock the auth module to prevent process.env access
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
  getTokenFromCookies: vi.fn(),
  setTokenCookie: vi.fn(),
  clearTokenCookie: vi.fn(),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Import component AFTER mocks
const { ImageUploader } = await import('../ImageUploader')

// Helper to create a mock File
function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(size).fill('a').join('')
  return new File([content], name, { type })
}

// Helper to simulate file selection on input
function simulateFileSelect(input: HTMLInputElement, files: File[]) {
  // Create a mock FileList
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (const file of files) yield file
    },
  } as unknown as FileList

  // Add indexed access
  files.forEach((file, index) => {
    Object.defineProperty(fileList, index, { value: file, enumerable: true })
  })

  // Use Object.defineProperty with configurable: true to allow redefinition
  Object.defineProperty(input, 'files', {
    value: fileList,
    configurable: true,
  })

  input.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('ImageUploader Browser Tests', () => {
  const mockOnImageChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render upload button without preview', async () => {
    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    await expect.element(screen.getByRole('button', { name: 'Upload Image' })).toBeVisible()
    await expect.element(screen.getByText('Restaurant Image', { exact: true })).toBeVisible()
    await expect.element(screen.getByText(/JPEG, PNG, or WebP/)).toBeVisible()
  })

  it('should render with current image preview', async () => {
    const screen = await render(
      <ImageUploader
        currentImageUrl="/uploads/test-image.jpg"
        onImageChange={mockOnImageChange}
      />
    )

    await expect.element(screen.getByRole('button', { name: 'Change Image' })).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Remove' })).toBeVisible()
    await expect.element(screen.getByTestId('next-image')).toBeVisible()
  })

  it('should disable buttons when disabled prop is true', async () => {
    const screen = await render(
      <ImageUploader
        currentImageUrl="/uploads/test-image.jpg"
        onImageChange={mockOnImageChange}
        disabled
      />
    )

    const changeButton = screen.getByRole('button', { name: 'Change Image' })
    const removeButton = screen.getByRole('button', { name: 'Remove' })

    await expect.element(changeButton).toBeDisabled()
    await expect.element(removeButton).toBeDisabled()
  })

  it('should show error for invalid file type', async () => {
    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement

    // Create an invalid file (PDF)
    const invalidFile = createMockFile('test.pdf', 1000, 'application/pdf')
    simulateFileSelect(fileInput, [invalidFile])

    await expect.element(screen.getByText('Only JPEG, PNG, and WebP images are allowed')).toBeVisible()
    expect(mockUploadImageAction).not.toHaveBeenCalled()
  })

  it('should show error for file that is too large', async () => {
    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement

    // Create a file larger than 5MB
    const largeFile = createMockFile('large.jpg', 6 * 1024 * 1024, 'image/jpeg')
    simulateFileSelect(fileInput, [largeFile])

    await expect.element(screen.getByText('Image must be less than 5MB')).toBeVisible()
    expect(mockUploadImageAction).not.toHaveBeenCalled()
  })

  it('should upload valid file successfully', async () => {
    mockUploadImageAction.mockResolvedValueOnce({
      success: true,
      data: { imageUrl: '/uploads/new-image.jpg' },
    })

    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement

    // Create a valid file
    const validFile = createMockFile('test.jpg', 1000, 'image/jpeg')
    simulateFileSelect(fileInput, [validFile])

    // Wait for upload to complete
    await vi.waitFor(() => {
      expect(mockUploadImageAction).toHaveBeenCalled()
    })

    await vi.waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith('/uploads/new-image.jpg')
    })
  })

  it('should show error when upload fails', async () => {
    mockUploadImageAction.mockResolvedValueOnce({
      success: false,
      error: 'Upload failed on server',
    })

    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    const validFile = createMockFile('test.jpg', 1000, 'image/jpeg')
    simulateFileSelect(fileInput, [validFile])

    await vi.waitFor(() => {
      expect(mockUploadImageAction).toHaveBeenCalled()
    })

    await expect.element(screen.getByText('Upload failed on server')).toBeVisible()
    expect(mockOnImageChange).not.toHaveBeenCalled()
  })

  it('should handle upload exception', async () => {
    mockUploadImageAction.mockRejectedValueOnce(new Error('Network error'))

    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    const validFile = createMockFile('test.jpg', 1000, 'image/jpeg')
    simulateFileSelect(fileInput, [validFile])

    await vi.waitFor(() => {
      expect(mockUploadImageAction).toHaveBeenCalled()
    })

    await expect.element(screen.getByText('Failed to upload image')).toBeVisible()
    expect(mockOnImageChange).not.toHaveBeenCalled()
  })

  it('should remove image when Remove button is clicked', async () => {
    const screen = await render(
      <ImageUploader
        currentImageUrl="/uploads/test-image.jpg"
        onImageChange={mockOnImageChange}
      />
    )

    await screen.getByRole('button', { name: 'Remove' }).click()

    expect(mockOnImageChange).toHaveBeenCalledWith('')
    await expect.element(screen.getByRole('button', { name: 'Upload Image' })).toBeVisible()
  })

  it('should show uploading state during upload', async () => {
    // Make the upload hang
    mockUploadImageAction.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true, data: { imageUrl: '/test.jpg' } }), 1000))
    )

    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    const validFile = createMockFile('test.jpg', 1000, 'image/jpeg')
    simulateFileSelect(fileInput, [validFile])

    // Should show "Uploading..." while in progress
    await expect.element(screen.getByRole('button', { name: 'Uploading...' })).toBeVisible()
  })

  it('should accept PNG files', async () => {
    mockUploadImageAction.mockResolvedValueOnce({
      success: true,
      data: { imageUrl: '/uploads/test.png' },
    })

    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    const pngFile = createMockFile('test.png', 1000, 'image/png')
    simulateFileSelect(fileInput, [pngFile])

    await vi.waitFor(() => {
      expect(mockUploadImageAction).toHaveBeenCalled()
    })

    await vi.waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith('/uploads/test.png')
    })
  })

  it('should accept WebP files', async () => {
    mockUploadImageAction.mockResolvedValueOnce({
      success: true,
      data: { imageUrl: '/uploads/test.webp' },
    })

    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    const webpFile = createMockFile('test.webp', 1000, 'image/webp')
    simulateFileSelect(fileInput, [webpFile])

    await vi.waitFor(() => {
      expect(mockUploadImageAction).toHaveBeenCalled()
    })

    await vi.waitFor(() => {
      expect(mockOnImageChange).toHaveBeenCalledWith('/uploads/test.webp')
    })
  })

  it('should do nothing when no file is selected', async () => {
    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    simulateFileSelect(fileInput, [])

    expect(mockUploadImageAction).not.toHaveBeenCalled()
    expect(mockOnImageChange).not.toHaveBeenCalled()
  })

  it('should click hidden file input when Upload button is clicked', async () => {
    const screen = await render(
      <ImageUploader onImageChange={mockOnImageChange} />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, 'click')

    await screen.getByRole('button', { name: 'Upload Image' }).click()

    expect(clickSpy).toHaveBeenCalled()
  })

  it('should revert preview on upload failure with existing image', async () => {
    mockUploadImageAction.mockResolvedValueOnce({
      success: false,
      error: 'Server error',
    })

    const screen = await render(
      <ImageUploader
        currentImageUrl="/uploads/original.jpg"
        onImageChange={mockOnImageChange}
      />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    const validFile = createMockFile('test.jpg', 1000, 'image/jpeg')
    simulateFileSelect(fileInput, [validFile])

    await vi.waitFor(() => {
      expect(mockUploadImageAction).toHaveBeenCalled()
    })

    // Preview should revert to original image
    await expect.element(screen.getByText('Server error')).toBeVisible()
    // Change Image button should still be visible (preview reverted to original)
    await expect.element(screen.getByRole('button', { name: 'Change Image' })).toBeVisible()
  })

  it('should revert preview on upload exception with existing image', async () => {
    mockUploadImageAction.mockRejectedValueOnce(new Error('Network error'))

    const screen = await render(
      <ImageUploader
        currentImageUrl="/uploads/original.jpg"
        onImageChange={mockOnImageChange}
      />
    )

    const fileInput = screen.container.querySelector('input[type="file"]') as HTMLInputElement
    const validFile = createMockFile('test.jpg', 1000, 'image/jpeg')
    simulateFileSelect(fileInput, [validFile])

    await vi.waitFor(() => {
      expect(mockUploadImageAction).toHaveBeenCalled()
    })

    await expect.element(screen.getByText('Failed to upload image')).toBeVisible()
    await expect.element(screen.getByRole('button', { name: 'Change Image' })).toBeVisible()
  })
})
