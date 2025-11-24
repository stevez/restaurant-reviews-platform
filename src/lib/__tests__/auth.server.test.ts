jest.mock('jose')

import {
  getCurrentUser,
  setTokenCookie,
  clearTokenCookie,
  getTokenFromCookies,
  generateToken,
} from '../auth'
import { cookies } from 'next/headers'

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

const mockCookies = cookies as jest.MockedFunction<typeof cookies>

describe('Auth server utilities', () => {
  let mockCookieStore: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    }
    mockCookies.mockReturnValue(mockCookieStore)
  })

  describe('getTokenFromCookies', () => {
    it('should return token when it exists', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'test-token' })

      const token = await getTokenFromCookies()

      expect(token).toBe('test-token')
      expect(mockCookieStore.get).toHaveBeenCalledWith('auth-token')
    })

    it('should return null when token does not exist', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const token = await getTokenFromCookies()

      expect(token).toBeNull()
    })
  })

  describe('setTokenCookie', () => {
    it('should set cookie with correct options', async () => {
      const testToken = 'test-token-123'

      await setTokenCookie(testToken)

      expect(mockCookieStore.set).toHaveBeenCalledWith('auth-token', testToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
      })
    })
  })

  describe('clearTokenCookie', () => {
    it('should delete the auth token cookie', async () => {
      await clearTokenCookie()

      expect(mockCookieStore.delete).toHaveBeenCalledWith('auth-token')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user data when valid token exists', async () => {
      const mockPayload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'REVIEWER' as const,
      }

      const token = await generateToken(mockPayload)
      mockCookieStore.get.mockReturnValue({ value: token })

      const user = await getCurrentUser()

      expect(user).toBeDefined()
      expect(user?.userId).toBe(mockPayload.userId)
      expect(user?.email).toBe(mockPayload.email)
      expect(user?.role).toBe(mockPayload.role)
    })

    it('should return null when no token exists', async () => {
      mockCookieStore.get.mockReturnValue(undefined)

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })

    it('should return null when token is invalid', async () => {
      mockCookieStore.get.mockReturnValue({ value: 'invalid-token' })

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })

    it('should return null when token is expired', async () => {
      // This is handled by verifyToken, but we can test the flow
      mockCookieStore.get.mockReturnValue({ value: 'expired.jwt.token' })

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })

    it('should handle OWNER role correctly', async () => {
      const mockPayload = {
        userId: 'owner123',
        email: 'owner@example.com',
        role: 'OWNER' as const,
      }

      const token = await generateToken(mockPayload)
      mockCookieStore.get.mockReturnValue({ value: token })

      const user = await getCurrentUser()

      expect(user).toBeDefined()
      expect(user?.role).toBe('OWNER')
    })
  })

  describe('Integration tests', () => {
    it('should handle complete auth flow', async () => {
      const mockPayload = {
        userId: 'integration-test',
        email: 'integration@example.com',
        role: 'REVIEWER' as const,
      }

      // Generate and set token
      const token = await generateToken(mockPayload)
      await setTokenCookie(token)
      expect(mockCookieStore.set).toHaveBeenCalled()

      // Simulate cookie retrieval
      mockCookieStore.get.mockReturnValue({ value: token })

      // Verify user can be retrieved
      const user = await getCurrentUser()
      expect(user?.userId).toBe(mockPayload.userId)
      expect(user?.email).toBe(mockPayload.email)
      expect(user?.role).toBe(mockPayload.role)

      // Clear token
      await clearTokenCookie()
      expect(mockCookieStore.delete).toHaveBeenCalledWith('auth-token')
    })
  })
})
