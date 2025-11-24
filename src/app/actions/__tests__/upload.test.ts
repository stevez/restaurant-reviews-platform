import { uploadImage } from '../upload'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

// Mock fs modules
jest.mock('fs/promises')
jest.mock('fs')

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
    jest.clearAllMocks();
    (existsSync as jest.Mock).mockReturnValue(true);
    (writeFile as jest.Mock).mockResolvedValue(undefined);
    (mkdir as jest.Mock).mockResolvedValue(undefined);
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
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', mockFile)

    const result = await uploadImage(formData)

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toContain('JPEG, PNG, and WebP')
    }
  })

  it('should handle file upload errors', async () => {
    (writeFile as jest.Mock).mockRejectedValue(new Error('Write failed'))

    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('file', mockFile)

    const result = await uploadImage(formData)

    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error).toBe('Failed to upload image')
    }
  })
})
