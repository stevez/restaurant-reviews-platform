import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, Mock } from 'vitest'
import { loginAction, registerAction, logoutAction, getCurrentUser } from '../auth'
import { prisma } from '@/lib/db'
import bcryptjs from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { setTokenCookie } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn()
  },
  compare: vi.fn(),
  hash: vi.fn()
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn()
}))

vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  generateToken: vi.fn(() => 'mock-token'),
  setTokenCookie: vi.fn(),
  verifyToken: vi.fn((token) => {
    if (token === 'valid-token') {
      return { userId: '1', email: 'test@example.com', role: 'REVIEWER' };
    }
    if (token === 'error-token') {
      throw new Error('Token verification failed');
    }
    return null;
  })
}))

// Selectively suppress only expected error logs from auth actions
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Only suppress expected auth error logs
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Login error:') ||
       args[0].includes('Register error:') ||
       args[0].includes('Get current user error:'))
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

describe('Auth Actions', () => {
  const mockCookies = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks();
    (cookies as Mock).mockReturnValue(mockCookies)
  })

  describe('loginAction', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'REVIEWER'
      };

      (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);
      (bcryptjs.compare as Mock).mockResolvedValue(true)

      const result = await loginAction('test@example.com', 'Password123')

      expect('success' in result).toBe(true)
      if ('success' in result) {
        expect(result.user.email).toBe('test@example.com')
      }
      expect(setTokenCookie).toHaveBeenCalledWith('mock-token')
    })

    it('should return error for non-existent user', async () => {
      (prisma.user.findUnique as Mock).mockResolvedValue(null)

      const result = await loginAction('test@example.com', 'wrong')

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Invalid email or password')
      }
    })

    it('should return error for invalid password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed-password',
        name: 'Test User',
        role: 'REVIEWER'
      };

      (prisma.user.findUnique as Mock).mockResolvedValue(mockUser);
      (bcryptjs.compare as Mock).mockResolvedValue(false)

      const result = await loginAction('test@example.com', 'wrong')

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Invalid email or password')
      }
    })

    it('should return "Invalid input" for ZodError', async () => {
      const result = await loginAction('invalid-email', 'short')

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Invalid input')
        expect(result.details).toBeInstanceOf(Array)
      }
    })

    it('should return "Internal server error" for other errors', async () => {
      (prisma.user.findUnique as Mock).mockRejectedValue(new Error('DB error'));
      const result = await loginAction('test@example.com', 'Password123');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Internal server error');
      }
    });
  })

  describe('registerAction', () => {
    it('should register user successfully', async () => {
      (prisma.user.findUnique as Mock).mockResolvedValue(null);
      (bcryptjs.hash as Mock).mockResolvedValue('hashed-password');
      (prisma.user.create as Mock).mockResolvedValue({
        id: '1',
        email: 'new@example.com',
        name: 'New User',
        role: 'REVIEWER'
      })

      const result = await registerAction('new@example.com', 'Password123', 'New User', 'REVIEWER')

      expect('success' in result).toBe(true)
      if ('success' in result) {
        expect(result.user.email).toBe('new@example.com')
      }
      expect(setTokenCookie).toHaveBeenCalledWith('mock-token')
    })

    it('should return error for existing email', async () => {
      (prisma.user.findUnique as Mock).mockResolvedValue({ id: '1', email: 'existing@example.com' })

      const result = await registerAction('existing@example.com', 'Password123', 'User', 'REVIEWER')

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Email already registered')
      }
    })

    it('should return "Validation failed" for ZodError', async () => {
      const result = await registerAction('invalid', 'short', '', 'REVIEWER')

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Validation failed')
        expect(result.details).toBeInstanceOf(Array)
      }
    })

    it('should return "Internal server error" for other errors', async () => {
      (prisma.user.findUnique as Mock).mockRejectedValue(new Error('DB error'));
      const result = await registerAction('test@example.com', 'Password123', 'Test User', 'REVIEWER');
      expect('error' in result).toBe(true);
      if ('error' in result) {
        expect(result.error).toBe('Internal server error');
      }
    });
  })

  describe('logoutAction', () => {
    it('should delete auth cookie and redirect', async () => {
      await logoutAction()
      
      expect(mockCookies.delete).toHaveBeenCalledWith('auth-token')
      expect(redirect).toHaveBeenCalledWith('/login')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user for valid token', async () => {
      mockCookies.get.mockReturnValue({ value: 'valid-token' });
      (prisma.user.findUnique as Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'REVIEWER'
      })

      const user = await getCurrentUser()

      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
    })

    it('should return null for missing token', async () => {
      mockCookies.get.mockReturnValue(undefined)

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })

    it('should return null for invalid token', async () => {
      mockCookies.get.mockReturnValue({ value: 'invalid-token' })

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })

    it('should return null if verifyToken throws an error', async () => {
      mockCookies.get.mockReturnValue({ value: 'error-token' }); // This token is set to throw an error in the mock
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return null if user not found in DB even with valid token', async () => {
      mockCookies.get.mockReturnValue({ value: 'valid-token' });
      (prisma.user.findUnique as Mock).mockResolvedValue(null);
      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  })
})