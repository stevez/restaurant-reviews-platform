import { describe, it, expect, vi, beforeEach } from 'vitest'

// Create mock token data
const createMockToken = (payload: any) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const body = Buffer.from(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + 7 * 24 * 60 * 60 // 7 days
  })).toString('base64url')
  const signature = Buffer.from('mock-signature').toString('base64url')
  return `${header}.${body}.${signature}`
}

// Mock jose module with proper class constructor
vi.mock('jose', () => {
  // Mock SignJWT class
  class MockSignJWT {
    private payload: any

    constructor(payload: any) {
      this.payload = payload
    }

    setProtectedHeader() {
      return this
    }

    setIssuedAt() {
      return this
    }

    setExpirationTime() {
      return this
    }

    async sign() {
      return createMockToken(this.payload)
    }
  }

  return {
    SignJWT: MockSignJWT,
    jwtVerify: vi.fn().mockImplementation((token: string) => {
      try {
        const parts = token.split('.')
        if (parts.length !== 3) {
          return Promise.reject(new Error('Invalid token format'))
        }
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
        return Promise.resolve({ payload })
      } catch {
        return Promise.reject(new Error('Invalid token'))
      }
    })
  }
})

import { generateToken, verifyToken } from '../auth'

describe('Auth utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'REVIEWER' as const,
      }

      const token = await generateToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different users', async () => {
      const payload1 = {
        userId: 'user1',
        email: 'user1@example.com',
        role: 'REVIEWER' as const,
      }

      const payload2 = {
        userId: 'user2',
        email: 'user2@example.com',
        role: 'OWNER' as const,
      }

      const token1 = await generateToken(payload1)
      const token2 = await generateToken(payload2)

      // Tokens will be different because payloads are different
      expect(token1).not.toBe(token2)
    })
  })

  describe('verifyToken', () => {
    it('should verify and decode a valid token', async () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'REVIEWER' as const,
      }

      const token = await generateToken(payload)
      const decoded = await verifyToken(token)

      expect(decoded).toBeDefined()
      expect(decoded?.userId).toBe(payload.userId)
      expect(decoded?.email).toBe(payload.email)
      expect(decoded?.role).toBe(payload.role)
      expect(decoded?.iat).toBeDefined()
      expect(decoded?.exp).toBeDefined()
    })

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid.token.here'
      const decoded = await verifyToken(invalidToken)

      expect(decoded).toBeNull()
    })

    it('should return null for malformed token', async () => {
      const malformedToken = 'not-a-jwt-token'
      const decoded = await verifyToken(malformedToken)

      expect(decoded).toBeNull()
    })

    it('should verify token expiration is set', async () => {
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        role: 'OWNER' as const,
      }

      const token = await generateToken(payload)
      const decoded = await verifyToken(token)

      expect(decoded?.exp).toBeDefined()
      expect(decoded?.exp).toBeGreaterThan(decoded?.iat!)

      // Token should expire in approximately 7 days (604800 seconds)
      const expiryDuration = decoded?.exp! - decoded?.iat!
      expect(expiryDuration).toBeGreaterThan(604000) // ~7 days
      expect(expiryDuration).toBeLessThan(605000) // ~7 days with buffer
    })

    it('should handle tokens with different roles', async () => {
      const reviewerPayload = {
        userId: 'reviewer1',
        email: 'reviewer@example.com',
        role: 'REVIEWER' as const,
      }

      const ownerPayload = {
        userId: 'owner1',
        email: 'owner@example.com',
        role: 'OWNER' as const,
      }

      const reviewerToken = await generateToken(reviewerPayload)
      const ownerToken = await generateToken(ownerPayload)

      const decodedReviewer = await verifyToken(reviewerToken)
      const decodedOwner = await verifyToken(ownerToken)

      expect(decodedReviewer?.role).toBe('REVIEWER')
      expect(decodedOwner?.role).toBe('OWNER')
    })
  })

  describe('Token lifecycle', () => {
    it('should create and verify token in complete flow', async () => {
      const originalPayload = {
        userId: 'lifecycle-test',
        email: 'lifecycle@example.com',
        role: 'REVIEWER' as const,
      }

      // Generate token
      const token = await generateToken(originalPayload)
      expect(token).toBeTruthy()

      // Verify token
      const decodedPayload = await verifyToken(token)
      expect(decodedPayload).toBeTruthy()
      expect(decodedPayload?.userId).toBe(originalPayload.userId)
      expect(decodedPayload?.email).toBe(originalPayload.email)
      expect(decodedPayload?.role).toBe(originalPayload.role)
    })
  })
})
