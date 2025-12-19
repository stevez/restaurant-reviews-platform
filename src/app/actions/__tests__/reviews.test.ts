import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, Mock, test } from 'vitest'
import { createReview, updateReview, deleteReview, getMyReview } from '../reviews';
import { getCurrentUser } from '../auth';
import { revalidatePath } from 'next/cache';

// Use vi.hoisted to create the mock object before vi.mock runs
const { mockReview } = vi.hoisted(() => ({
  mockReview: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock external dependencies
vi.mock('@/lib/db', () => ({
  getPrisma: () => ({
    review: mockReview,
  }),
  prisma: {
    review: mockReview,
  },
}));

// Alias for backwards compatibility with test code
const mockPrisma = { review: mockReview };

vi.mock('../auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Selectively suppress only expected error logs from review actions
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Only suppress expected review error logs
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Create review error:') ||
       args[0].includes('Update review error:') ||
       args[0].includes('Delete review error:'))
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

describe('Review Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    test('should create a new review if user is a reviewer and has not reviewed before', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      const mockReview = { id: 'review1', restaurantId: 'rest1', userId: 'user1', rating: 5, comment: 'Great!' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(null);
      (mockPrisma.review.create as Mock).mockResolvedValue(mockReview);

      const result = await createReview('rest1', 5, 'Great!');

      expect(mockPrisma.review.create).toHaveBeenCalledWith({
        data: {
          rating: 5,
          comment: 'Great!',
          restaurantId: 'rest1',
          userId: 'user1',
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/reviewer/restaurants/rest1');
      expect(result).toEqual({ success: true, data: mockReview });
    });

    test('should return unauthorized if user is not a reviewer', async () => {
      const mockUser = { id: 'user1', role: 'OWNER' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);

      const result = await createReview('rest1', 5, 'Great!');

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    test('should return unauthorized if no user is logged in', async () => {
      (getCurrentUser as Mock).mockResolvedValue(null);

      const result = await createReview('rest1', 5, 'Great!');

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    test('should return error if user has already reviewed the restaurant', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      const existingReview = { id: 'review1', restaurantId: 'rest1', userId: 'user1', rating: 4 };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(existingReview);

      const result = await createReview('rest1', 5, 'Great!');

      expect(result).toEqual({ success: false, error: 'You have already reviewed this restaurant' });
      expect(mockPrisma.review.create).not.toHaveBeenCalled();
    });

    test('should handle database errors during creation', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(null);
      (mockPrisma.review.create as Mock).mockRejectedValue(new Error('Database error'));

      const result = await createReview('rest1', 5, 'Great!');

      expect(result).toEqual({ success: false, error: 'Failed to create review' });
    });
  });

  describe('updateReview', () => {
    test('should update an existing review if user is the owner of the review', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      const mockReview = { id: 'review1', restaurantId: 'rest1', userId: 'user1', rating: 3, comment: 'Old comment' };
      const updatedReview = { ...mockReview, rating: 5, comment: 'New comment' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(mockReview);
      (mockPrisma.review.update as Mock).mockResolvedValue(updatedReview);

      const result = await updateReview('review1', 5, 'New comment');

      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review1' },
        data: { rating: 5, comment: 'New comment' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/reviewer/restaurants/rest1');
      expect(result).toEqual({ success: true, data: updatedReview });
    });

    test('should return unauthorized if user is not the owner of the review', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      const mockReview = { id: 'review1', restaurantId: 'rest1', userId: 'another-user', rating: 3 };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(mockReview);

      const result = await updateReview('review1', 5, 'New comment');

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockPrisma.review.update).not.toHaveBeenCalled();
    });

    test('should return unauthorized if no user is logged in', async () => {
      (getCurrentUser as Mock).mockResolvedValue(null);

      const result = await updateReview('review1', 5, 'New comment');

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockPrisma.review.update).not.toHaveBeenCalled();
    });

    test('should handle database errors during update', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      const mockReview = { id: 'review1', restaurantId: 'rest1', userId: 'user1', rating: 3 };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(mockReview);
      (mockPrisma.review.update as Mock).mockRejectedValue(new Error('Database error'));

      const result = await updateReview('review1', 5, 'New comment');

      expect(result).toEqual({ success: false, error: 'Failed to update review' });
    });
  });

  describe('deleteReview', () => {
    test('should delete an existing review if user is the owner of the review', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      const mockReview = { id: 'review1', restaurantId: 'rest1', userId: 'user1' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(mockReview);
      (mockPrisma.review.delete as Mock).mockResolvedValue(mockReview);

      const result = await deleteReview('review1');

      expect(mockPrisma.review.delete).toHaveBeenCalledWith({ where: { id: 'review1' } });
      expect(revalidatePath).toHaveBeenCalledWith('/reviewer/restaurants/rest1');
      expect(result).toEqual({ success: true });
    });

    test('should return unauthorized if user is not the owner of the review', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      const mockReview = { id: 'review1', restaurantId: 'rest1', userId: 'another-user' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(mockReview);

      const result = await deleteReview('review1');

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockPrisma.review.delete).not.toHaveBeenCalled();
    });

    test('should return unauthorized if no user is logged in', async () => {
      (getCurrentUser as Mock).mockResolvedValue(null);

      const result = await deleteReview('review1');

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockPrisma.review.delete).not.toHaveBeenCalled();
    });

    test('should handle database errors during deletion', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      const mockReview = { id: 'review1', restaurantId: 'rest1', userId: 'user1' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(mockReview);
      (mockPrisma.review.delete as Mock).mockRejectedValue(new Error('Database error'));

      const result = await deleteReview('review1');

      expect(result).toEqual({ success: false, error: 'Failed to delete review' });
    });
  });

  describe('getMyReview', () => {
    test('should return the user\'s review for a specific restaurant', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      const mockReview = { id: 'review1', restaurantId: 'rest1', userId: 'user1', rating: 5 };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(mockReview);

      const result = await getMyReview('rest1');

      expect(result).toEqual(mockReview);
      expect(mockPrisma.review.findUnique).toHaveBeenCalledWith({
        where: {
          restaurantId_userId: {
            restaurantId: 'rest1',
            userId: 'user1',
          },
        },
      });
    });

    test('should return null if no user is logged in', async () => {
      (getCurrentUser as Mock).mockResolvedValue(null);

      const result = await getMyReview('rest1');

      expect(result).toBeNull();
    });

    test('should return null if no review is found', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (mockPrisma.review.findUnique as Mock).mockResolvedValue(null);

      const result = await getMyReview('rest1');

      expect(result).toBeNull();
    });
  });
});