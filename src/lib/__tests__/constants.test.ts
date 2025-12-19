import { describe, it, expect } from 'vitest'
import {
  CUISINE_TYPES,
  RATING_OPTIONS,
  MIN_RATING_FILTERS,
  SORT_OPTIONS,
  JWT_EXPIRY_DAYS,
  JWT_EXPIRY_SECONDS,
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
  MIN_IMAGE_WIDTH,
  MIN_IMAGE_HEIGHT,
  DEFAULT_ITEMS_PER_PAGE,
  ERROR_MESSAGES,
  ROUTE_PATHS,
} from '../constants'

describe('Constants', () => {
  describe('CUISINE_TYPES', () => {
    it('should contain expected cuisine types', () => {
      expect(CUISINE_TYPES).toContain('Italian')
      expect(CUISINE_TYPES).toContain('French')
      expect(CUISINE_TYPES).toContain('Chinese')
      expect(CUISINE_TYPES).toContain('Japanese')
      expect(CUISINE_TYPES).toContain('Other')
    })

    it('should have at least 10 cuisine types', () => {
      expect(CUISINE_TYPES.length).toBeGreaterThanOrEqual(10)
    })
  })

  describe('RATING_OPTIONS', () => {
    it('should contain ratings 1 through 5', () => {
      expect(RATING_OPTIONS).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('MIN_RATING_FILTERS', () => {
    it('should have filter options from 0 to 5', () => {
      expect(MIN_RATING_FILTERS).toHaveLength(6)
      expect(MIN_RATING_FILTERS[0]).toEqual({ value: 0, label: 'All Ratings' })
      expect(MIN_RATING_FILTERS[5]).toEqual({ value: 5, label: '5 Stars' })
    })
  })

  describe('SORT_OPTIONS', () => {
    it('should have best and worst options', () => {
      expect(SORT_OPTIONS).toEqual([
        { value: 'best', label: 'Best Rated' },
        { value: 'worst', label: 'Worst Rated' },
      ])
    })
  })

  describe('JWT Configuration', () => {
    it('should have correct JWT expiry', () => {
      expect(JWT_EXPIRY_DAYS).toBe(7)
      expect(JWT_EXPIRY_SECONDS).toBe(7 * 24 * 60 * 60)
    })
  })

  describe('Image Configuration', () => {
    it('should have correct max image size', () => {
      expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024) // 5MB
    })

    it('should allow JPEG, PNG, and WebP', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg')
      expect(ALLOWED_IMAGE_TYPES).toContain('image/png')
      expect(ALLOWED_IMAGE_TYPES).toContain('image/webp')
    })

    it('should have minimum dimensions', () => {
      expect(MIN_IMAGE_WIDTH).toBe(400)
      expect(MIN_IMAGE_HEIGHT).toBe(300)
    })
  })

  describe('DEFAULT_ITEMS_PER_PAGE', () => {
    it('should be 12', () => {
      expect(DEFAULT_ITEMS_PER_PAGE).toBe(12)
    })
  })

  describe('ERROR_MESSAGES', () => {
    it('should have all required error messages', () => {
      expect(ERROR_MESSAGES.UNAUTHORIZED).toBeDefined()
      expect(ERROR_MESSAGES.FORBIDDEN).toBeDefined()
      expect(ERROR_MESSAGES.NOT_FOUND).toBeDefined()
      expect(ERROR_MESSAGES.INVALID_CREDENTIALS).toBeDefined()
      expect(ERROR_MESSAGES.EMAIL_EXISTS).toBeDefined()
      expect(ERROR_MESSAGES.WEAK_PASSWORD).toBeDefined()
      expect(ERROR_MESSAGES.INVALID_EMAIL).toBeDefined()
      expect(ERROR_MESSAGES.REQUIRED_FIELD).toBeDefined()
      expect(ERROR_MESSAGES.DUPLICATE_REVIEW).toBeDefined()
    })

    it('should have image-related error messages', () => {
      expect(ERROR_MESSAGES.IMAGE_TOO_LARGE).toBeDefined()
      expect(ERROR_MESSAGES.INVALID_IMAGE_TYPE).toBeDefined()
      expect(ERROR_MESSAGES.IMAGE_DIMENSIONS_TOO_SMALL).toBeDefined()
    })
  })

  describe('ROUTE_PATHS', () => {
    it('should have all main routes', () => {
      expect(ROUTE_PATHS.HOME).toBe('/')
      expect(ROUTE_PATHS.LOGIN).toBe('/login')
      expect(ROUTE_PATHS.REGISTER).toBe('/register')
      expect(ROUTE_PATHS.REVIEWER_DASHBOARD).toBe('/reviewer')
      expect(ROUTE_PATHS.OWNER_DASHBOARD).toBe('/owner')
      expect(ROUTE_PATHS.OWNER_MY_RESTAURANTS).toBe('/owner/my-restaurants')
      expect(ROUTE_PATHS.OWNER_CREATE).toBe('/owner/create')
    })
  })
})
