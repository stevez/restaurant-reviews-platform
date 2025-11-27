import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, Mock, test } from 'vitest'
import { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant, getMyRestaurants } from '../restaurants';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '../auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Mock external dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    restaurant: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Selectively suppress only expected error logs from server actions
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Only suppress expected server action error logs
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Create restaurant error:') ||
       args[0].includes('Update restaurant error:') ||
       args[0].includes('Delete restaurant error:'))
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

describe('Restaurant Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRestaurants', () => {
    test('should return restaurants with calculated average ratings', async () => {
      const mockRestaurants = [
        {
          id: '1', title: 'Restaurant A', description: 'Desc A', location: 'Loc A', cuisine: ['Italian'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 5 }, { rating: 4 }],
        },
        {
          id: '2', title: 'Restaurant B', description: 'Desc B', location: 'Loc B', cuisine: ['Mexican'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 3 }],
        },
        {
          id: '3', title: 'Restaurant C', description: 'Desc C', location: 'Loc C', cuisine: ['Indian'], imageUrl: '', ownerId: 'owner1',
          reviews: [],
        },
      ];
      (prisma.restaurant.findMany as Mock).mockResolvedValue(mockRestaurants);

      const result = await getRestaurants();

      expect(result).toHaveLength(3);
      expect(result[0].averageRating).toBe(4.5);
      expect(result[1].averageRating).toBe(3);
      expect(result[2].averageRating).toBe(0);
    });

    test('should filter restaurants by cuisine', async () => {
      const mockRestaurants = [
        {
          id: '1', title: 'Restaurant A', description: 'Desc A', location: 'Loc A', cuisine: ['Italian', 'Pizza'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 5 }],
        },
        {
          id: '2', title: 'Restaurant B', description: 'Desc B', location: 'Loc B', cuisine: ['Mexican'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 3 }],
        },
        {
          id: '3', title: 'Restaurant C', description: 'Desc C', location: 'Loc C', cuisine: ['Italian'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 4 }],
        },
      ];
      (prisma.restaurant.findMany as Mock).mockImplementation((options) => {
        let filtered = mockRestaurants;
        if (options?.where?.cuisine?.hasSome?.length > 0) {
          const cuisinesToFilter = options.where.cuisine.hasSome;
          filtered = filtered.filter(r => r.cuisine.some(c => cuisinesToFilter.includes(c)));
        }
        return Promise.resolve(filtered.map(r => ({
          ...r,
          reviews: r.reviews.map(rev => ({ rating: rev.rating }))
        })));
      });

      const result = await getRestaurants({ cuisine: ['Italian'] });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    test('should filter restaurants by minimum rating', async () => {
      const mockRestaurants = [
        {
          id: '1', title: 'Restaurant A', description: 'Desc A', location: 'Loc A', cuisine: ['Italian'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 5 }, { rating: 4 }], averageRating: 4.5
        },
        {
          id: '2', title: 'Restaurant B', description: 'Desc B', location: 'Loc B', cuisine: ['Mexican'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 3 }], averageRating: 3
        },
        {
          id: '3', title: 'Restaurant C', description: 'Desc C', location: 'Loc C', cuisine: ['Indian'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 2 }], averageRating: 2
        },
      ];
      // Mock the internal calculation of averageRating by providing it directly
      (prisma.restaurant.findMany as Mock).mockImplementation(() => {
        return Promise.resolve(mockRestaurants.map(r => ({
          ...r,
          reviews: r.reviews.map(rev => ({ rating: rev.rating })) // Ensure reviews structure matches
        })));
      });

      const result = await getRestaurants({ minRating: 3.5 });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    test('should sort restaurants by best rating by default', async () => {
      const mockRestaurants = [
        {
          id: '1', title: 'Restaurant A', description: 'Desc A', location: 'Loc A', cuisine: ['Italian'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 3 }], averageRating: 3
        },
        {
          id: '2', title: 'Restaurant B', description: 'Desc B', location: 'Loc B', cuisine: ['Mexican'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 5 }], averageRating: 5
        },
        {
          id: '3', title: 'Restaurant C', description: 'Desc C', location: 'Loc C', cuisine: ['Indian'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 4 }], averageRating: 4
        },
      ];
      (prisma.restaurant.findMany as Mock).mockImplementation(() => {
        return Promise.resolve(mockRestaurants.map(r => ({
          ...r,
          reviews: r.reviews.map(rev => ({ rating: rev.rating }))
        })));
      });

      const result = await getRestaurants();

      expect(result[0].id).toBe('2'); // Avg 5
      expect(result[1].id).toBe('3'); // Avg 4
      expect(result[2].id).toBe('1'); // Avg 3
    });

    test('should sort restaurants by worst rating when specified', async () => {
      const mockRestaurants = [
        {
          id: '1', title: 'Restaurant A', description: 'Desc A', location: 'Loc A', cuisine: ['Italian'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 3 }], averageRating: 3
        },
        {
          id: '2', title: 'Restaurant B', description: 'Desc B', location: 'Loc B', cuisine: ['Mexican'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 5 }], averageRating: 5
        },
        {
          id: '3', title: 'Restaurant C', description: 'Desc C', location: 'Loc C', cuisine: ['Indian'], imageUrl: '', ownerId: 'owner1',
          reviews: [{ rating: 4 }], averageRating: 4
        },
      ];
      (prisma.restaurant.findMany as Mock).mockImplementation(() => {
        return Promise.resolve(mockRestaurants.map(r => ({
          ...r,
          reviews: r.reviews.map(rev => ({ rating: rev.rating }))
        })));
      });

      const result = await getRestaurants({ sort: 'worst' });

      expect(result[0].id).toBe('1'); // Avg 3
      expect(result[1].id).toBe('3'); // Avg 4
      expect(result[2].id).toBe('2'); // Avg 5
    });
  });

  describe('getRestaurant', () => {
    test('should return a single restaurant by ID', async () => {
      const mockRestaurant = {
        id: '1', title: 'Restaurant A', description: 'Desc A', location: 'Loc A', cuisine: ['Italian'], imageUrl: '', ownerId: 'owner1',
        owner: { id: 'owner1', name: 'Owner 1' },
        reviews: [],
      };
      (prisma.restaurant.findUnique as Mock).mockResolvedValue(mockRestaurant);

      const result = await getRestaurant('1');

      expect(result).toEqual(mockRestaurant);
      expect(prisma.restaurant.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          owner: {
            select: {
              id: true,
              name: true
            }
          },
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });
    });

    test('should return null if restaurant not found', async () => {
      (prisma.restaurant.findUnique as Mock).mockResolvedValue(null);

      const result = await getRestaurant('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createRestaurant', () => {
    test('should create a new restaurant if user is owner', async () => {
      (getCurrentUser as Mock).mockResolvedValue({ id: 'owner1', role: 'OWNER' });
      (prisma.restaurant.create as Mock).mockResolvedValue({ id: 'new-restaurant-id' });

      const data = {
        title: 'New Restaurant',
        description: 'Delicious food',
        location: 'Test City',
        cuisine: ['Italian'],
        imageUrl: 'http://example.com/image.jpg',
      };

      await createRestaurant(data);

      expect(prisma.restaurant.create).toHaveBeenCalledWith({
        data: {
          title: 'New Restaurant',
          description: 'Delicious food',
          location: 'Test City',
          cuisine: ['Italian'],
          imageUrl: 'http://example.com/image.jpg',
          ownerId: 'owner1',
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(redirect).toHaveBeenCalledWith('/owner/my-restaurants');
    });

    test('should return unauthorized if user is not owner', async () => {
      (getCurrentUser as Mock).mockResolvedValue({ id: 'user1', role: 'REVIEWER' });

      const data = {
        title: 'New Restaurant',
        description: 'A restaurant',
        location: 'City',
        cuisine: ['Italian'],
      };

      const result = await createRestaurant(data);

      expect(result).toEqual({ error: 'Unauthorized' });
      expect(prisma.restaurant.create).not.toHaveBeenCalled();
    });

    test('should return unauthorized if no user is logged in', async () => {
      (getCurrentUser as Mock).mockResolvedValue(null);

      const data = {
        title: 'New Restaurant',
        description: 'A restaurant',
        location: 'City',
        cuisine: ['Italian'],
      };

      const result = await createRestaurant(data);

      expect(result).toEqual({ error: 'Unauthorized' });
      expect(prisma.restaurant.create).not.toHaveBeenCalled();
    });

    test('should handle database errors during creation', async () => {
      (getCurrentUser as Mock).mockResolvedValue({ id: 'owner1', role: 'OWNER' });
      (prisma.restaurant.create as Mock).mockRejectedValue(new Error('Database error'));

      const data = {
        title: 'New Restaurant',
        description: 'A restaurant',
        location: 'City',
        cuisine: ['Italian'],
      };

      const result = await createRestaurant(data);

      expect(result).toEqual({ error: 'Failed to create restaurant' });
    });
  });

  describe('updateRestaurant', () => {
    test('should update a restaurant if user is owner and owns the restaurant', async () => {
      const mockUser = { id: 'owner1', role: 'OWNER' };
      const mockRestaurant = { id: '1', ownerId: 'owner1', title: 'Old Title', imageUrl: '/restaurant1.jpg' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (prisma.restaurant.findUnique as Mock).mockResolvedValue(mockRestaurant);
      (prisma.restaurant.update as Mock).mockResolvedValue({ ...mockRestaurant, title: 'New Title' });

      const data = {
        title: 'New Title',
        description: 'New Description',
        location: 'New Location',
        cuisine: ['French'],
      };

      await updateRestaurant('1', data);

      expect(prisma.restaurant.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          title: 'New Title',
          description: 'New Description',
          location: 'New Location',
          cuisine: ['French'],
          imageUrl: '/restaurant1.jpg',
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/owner/my-restaurants');
      expect(revalidatePath).toHaveBeenCalledWith('/reviewer/restaurants/1');
      expect(redirect).toHaveBeenCalledWith('/owner/my-restaurants');
    });

    test('should return unauthorized if user does not own the restaurant', async () => {
      const mockUser = { id: 'owner1', role: 'OWNER' };
      const mockRestaurant = { id: '1', ownerId: 'another-owner', title: 'Old Title' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (prisma.restaurant.findUnique as Mock).mockResolvedValue(mockRestaurant);

      const data = {
        title: 'New Title',
        description: 'Description',
        location: 'Location',
        cuisine: ['Italian'],
      };

      const result = await updateRestaurant('1', data);

      expect(result).toEqual({ error: 'Unauthorized' });
      expect(prisma.restaurant.update).not.toHaveBeenCalled();
    });

    test('should return unauthorized if no user is logged in', async () => {
      (getCurrentUser as Mock).mockResolvedValue(null);

      const data = {
        title: 'New Title',
        description: 'Description',
        location: 'Location',
        cuisine: ['Italian'],
      };

      const result = await updateRestaurant('1', data);

      expect(result).toEqual({ error: 'Unauthorized' });
      expect(prisma.restaurant.update).not.toHaveBeenCalled();
    });

    test('should handle database errors during update', async () => {
      const mockUser = { id: 'owner1', role: 'OWNER' };
      const mockRestaurant = { id: '1', ownerId: 'owner1', title: 'Old Title', imageUrl: '/restaurant1.jpg' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (prisma.restaurant.findUnique as Mock).mockResolvedValue(mockRestaurant);
      (prisma.restaurant.update as Mock).mockRejectedValue(new Error('Database error'));

      const data = {
        title: 'New Title',
        description: 'Description',
        location: 'Location',
        cuisine: ['Italian'],
      };

      const result = await updateRestaurant('1', data);

      expect(result).toEqual({ error: 'Failed to update restaurant' });
    });
  });

  describe('deleteRestaurant', () => {
    test('should delete a restaurant if user is owner and owns the restaurant', async () => {
      const mockUser = { id: 'owner1', role: 'OWNER' };
      const mockRestaurant = { id: '1', ownerId: 'owner1' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (prisma.restaurant.findUnique as Mock).mockResolvedValue(mockRestaurant);
      (prisma.restaurant.delete as Mock).mockResolvedValue(mockRestaurant);

      const result = await deleteRestaurant('1');

      expect(prisma.restaurant.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/owner/my-restaurants');
      expect(result).toEqual({ success: true });
    });

    test('should return unauthorized if user does not own the restaurant', async () => {
      const mockUser = { id: 'owner1', role: 'OWNER' };
      const mockRestaurant = { id: '1', ownerId: 'another-owner' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (prisma.restaurant.findUnique as Mock).mockResolvedValue(mockRestaurant);

      const result = await deleteRestaurant('1');

      expect(result).toEqual({ error: 'Unauthorized' });
      expect(prisma.restaurant.delete).not.toHaveBeenCalled();
    });

    test('should return unauthorized if no user is logged in', async () => {
      (getCurrentUser as Mock).mockResolvedValue(null);

      const result = await deleteRestaurant('1');

      expect(result).toEqual({ error: 'Unauthorized' });
      expect(prisma.restaurant.delete).not.toHaveBeenCalled();
    });

    test('should handle database errors during deletion', async () => {
      const mockUser = { id: 'owner1', role: 'OWNER' };
      const mockRestaurant = { id: '1', ownerId: 'owner1' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (prisma.restaurant.findUnique as Mock).mockResolvedValue(mockRestaurant);
      (prisma.restaurant.delete as Mock).mockRejectedValue(new Error('Database error'));

      const result = await deleteRestaurant('1');

      expect(result).toEqual({ error: 'Failed to delete restaurant' });
    });
  });

  describe('getMyRestaurants', () => {
    test('should return a list of restaurants owned by the current user', async () => {
      const mockUser = { id: 'owner1', role: 'OWNER' };
      const mockRestaurants = [{ id: '1', ownerId: 'owner1', reviews: [] }];
      (getCurrentUser as Mock).mockResolvedValue(mockUser);
      (prisma.restaurant.findMany as Mock).mockResolvedValue(mockRestaurants);

      const result = await getMyRestaurants();

      expect(result).toEqual(mockRestaurants);
      expect(prisma.restaurant.findMany).toHaveBeenCalledWith({
        where: { ownerId: 'owner1' },
        include: { reviews: { select: { rating: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    test('should return empty array if user is not owner', async () => {
      const mockUser = { id: 'user1', role: 'REVIEWER' };
      (getCurrentUser as Mock).mockResolvedValue(mockUser);

      const result = await getMyRestaurants();

      expect(result).toEqual([]);
      expect(prisma.restaurant.findMany).not.toHaveBeenCalled();
    });

    test('should return empty array if no user is logged in', async () => {
      (getCurrentUser as Mock).mockResolvedValue(null);

      const result = await getMyRestaurants();

      expect(result).toEqual([]);
      expect(prisma.restaurant.findMany).not.toHaveBeenCalled();
    });
  });
});