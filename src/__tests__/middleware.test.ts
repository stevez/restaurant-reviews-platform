import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock the auth module
vi.mock('../lib/auth', () => ({
  verifyToken: vi.fn(),
}))

import { middleware, config } from '../middleware'
import { verifyToken } from '../lib/auth'

const mockVerifyToken = vi.mocked(verifyToken)

// Helper to create mock NextRequest
function createMockRequest(
  pathname: string,
  cookieToken?: string
): NextRequest {
  const url = new URL(pathname, 'http://localhost:3000')
  const request = new NextRequest(url)

  if (cookieToken) {
    // NextRequest cookies are read-only, so we need to create a new request with cookies
    const headers = new Headers()
    headers.set('cookie', `auth-token=${cookieToken}`)
    return new NextRequest(url, { headers })
  }

  return request
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('config', () => {
    it('should have correct matcher patterns', () => {
      expect(config.matcher).toContain('/owner/:path*')
      expect(config.matcher).toContain('/reviewer/:path*')
      expect(config.matcher).toContain('/login')
      expect(config.matcher).toContain('/register')
    })
  })

  describe('unauthenticated requests', () => {
    beforeEach(() => {
      mockVerifyToken.mockResolvedValue(null)
    })

    it('should allow access to /login without auth', async () => {
      const request = createMockRequest('/login')
      const response = await middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should allow access to /register without auth', async () => {
      const request = createMockRequest('/register')
      const response = await middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should redirect /owner to /login when not authenticated', async () => {
      const request = createMockRequest('/owner/my-restaurants')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login')
    })

    it('should redirect /reviewer to /login when not authenticated', async () => {
      const request = createMockRequest('/reviewer/restaurants/123')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login')
    })
  })

  describe('authenticated REVIEWER requests', () => {
    beforeEach(() => {
      mockVerifyToken.mockResolvedValue({
        userId: 'user123',
        email: 'reviewer@example.com',
        role: 'REVIEWER',
      })
    })

    it('should redirect /login to / for authenticated REVIEWER', async () => {
      const request = createMockRequest('/login', 'valid-token')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('should redirect /register to / for authenticated REVIEWER', async () => {
      const request = createMockRequest('/register', 'valid-token')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })

    it('should allow access to /reviewer routes', async () => {
      const request = createMockRequest('/reviewer/restaurants/123', 'valid-token')
      const response = await middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should redirect /owner to / for REVIEWER (wrong role)', async () => {
      const request = createMockRequest('/owner/my-restaurants', 'valid-token')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/')
    })
  })

  describe('authenticated OWNER requests', () => {
    beforeEach(() => {
      mockVerifyToken.mockResolvedValue({
        userId: 'owner123',
        email: 'owner@example.com',
        role: 'OWNER',
      })
    })

    it('should redirect /login to /owner/my-restaurants for authenticated OWNER', async () => {
      const request = createMockRequest('/login', 'valid-token')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/owner/my-restaurants')
    })

    it('should redirect /register to /owner/my-restaurants for authenticated OWNER', async () => {
      const request = createMockRequest('/register', 'valid-token')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/owner/my-restaurants')
    })

    it('should allow access to /owner routes', async () => {
      const request = createMockRequest('/owner/my-restaurants', 'valid-token')
      const response = await middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should allow access to /owner/create', async () => {
      const request = createMockRequest('/owner/create', 'valid-token')
      const response = await middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should allow access to /reviewer routes', async () => {
      const request = createMockRequest('/reviewer/restaurants/123', 'valid-token')
      const response = await middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })
  })

  describe('token verification', () => {
    it('should call verifyToken when cookie is present', async () => {
      mockVerifyToken.mockResolvedValue(null)
      const request = createMockRequest('/owner/my-restaurants', 'some-token')

      await middleware(request)

      expect(mockVerifyToken).toHaveBeenCalledWith('some-token')
    })

    it('should not call verifyToken when no cookie is present', async () => {
      const request = createMockRequest('/login')

      await middleware(request)

      expect(mockVerifyToken).not.toHaveBeenCalled()
    })

    it('should handle verifyToken returning null (invalid token)', async () => {
      mockVerifyToken.mockResolvedValue(null)
      const request = createMockRequest('/owner/my-restaurants', 'invalid-token')
      const response = await middleware(request)

      // Should redirect to login since token is invalid
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login')
    })
  })
})
