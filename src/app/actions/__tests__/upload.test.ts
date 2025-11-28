/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'

// Mock fs modules before importing uploadImage
vi.mock('fs/promises', () => ({
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}))

vi.mock('fs', () => ({
  existsSync: vi.fn(),
}))

import { uploadImage } from '../upload'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

// Helper to create a mock File with proper arrayBuffer support
function createMockFile(content: string, name: string, type: string): File {
  const blob = new Blob([content], { type })
  return new File([blob], name, { type })
}

// Selectively suppress only expected error logs from upload action
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Only suppress expected upload error logs
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Image upload error:')
    ) {
      return // Suppress this specific error
    }
    // Let all other errors through (like test failures)
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

describe('Upload Action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(existsSync).mockReturnValue(true)
    vi.mocked(writeFile).mockResolvedValue(undefined)
    vi.mocked(mkdir).mockResolvedValue(undefined)
  })

  it('should return error if file is missing', async () => {
    const formData = new FormData()

    const result = await uploadImage(formData)

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toBeDefined()
    }
  })

  it('should return error if file type is not allowed', async () => {
    const mockFile = createMockFile('test content', 'test.pdf', 'application/pdf')
    const formData = new FormData()
    formData.append('file', mockFile)

    const result = await uploadImage(formData)

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toContain('JPEG, PNG, and WebP')
    }
  })

  it('should handle file upload errors', async () => {
    vi.mocked(writeFile).mockRejectedValue(new Error('Write failed'))

    const mockFile = createMockFile('test content', 'test.jpg', 'image/jpeg')
    const formData = new FormData()
    formData.append('file', mockFile)

    const result = await uploadImage(formData)

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toBe('Failed to upload image')
    }
  })
})
