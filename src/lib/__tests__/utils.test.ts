import { describe, it, expect } from 'vitest'
import {
  cn,
  formatRelativeTime,
} from '../utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should merge Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    })
  })

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent dates', () => {
      const date = new Date()
      expect(formatRelativeTime(date)).toBe('just now')
    })

    it('should return minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      expect(formatRelativeTime(date)).toBe('5 minutes ago')
    })

    it('should return hours ago', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      expect(formatRelativeTime(date)).toBe('3 hours ago')
    })

    it('should return days ago', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      expect(formatRelativeTime(date)).toBe('2 days ago')
    })

    it('should return weeks ago', () => {
      const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 2 weeks ago
      expect(formatRelativeTime(date)).toBe('2 weeks ago')
    })

    it('should return months ago', () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // ~2 months ago
      expect(formatRelativeTime(date)).toBe('2 months ago')
    })

    it('should return years ago', () => {
      const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000) // ~1 year ago
      expect(formatRelativeTime(date)).toBe('1 years ago')
    })
  })

})
