'use server'

import { revalidatePath } from 'next/cache'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/db'
import { restaurantSchema, type RestaurantInput, type SavedPreferences } from '@/lib/validators'
import { type ActionResult } from '@/types/actions'
import { getCurrentUser } from './auth'
import { Restaurant, Review } from '@prisma/client'
import { calculateAverageRating } from '@/lib/utils'
import { type CuisineType } from '@/lib/constants'

type RestaurantWithRating = Omit<Restaurant, 'cuisine'> & {
  cuisine: CuisineType[]
  reviews: { rating: number }[]
  owner: { id: string; name: string }
  averageRating: number
  reviewCount: number
}

type RestaurantDetail = Omit<Restaurant, 'cuisine'> & {
  cuisine: CuisineType[]
  owner: { id: string; name: string }
  reviews: (Review & {
    user: { id: string; name: string }
  })[]
}

export async function getRestaurants(
  filters?: SavedPreferences
): Promise<RestaurantWithRating[]> {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      ...(filters?.cuisines && filters.cuisines.length > 0 && {
        cuisine: {
          hasSome: filters.cuisines
        }
      }),
      ...(filters?.location && {
        location: {
          contains: filters.location,
          mode: 'insensitive'
        }
      })
    },
    include: {
      reviews: {
        select: {
          rating: true
        }
      },
      owner: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  // Calculate ratings and review count
  const withRatings = restaurants.map(r => ({
    ...r,
    averageRating: calculateAverageRating(r.reviews),
    reviewCount: r.reviews.length
  }))

  // Filter by minimum rating
  let filtered = filters?.minRating
    ? withRatings.filter(r => r.averageRating >= filters.minRating!)
    : withRatings

  // Sort
  if (filters?.sort === 'worst') {
    filtered.sort((a, b) => a.averageRating - b.averageRating)
  } else {
    filtered.sort((a, b) => b.averageRating - a.averageRating)
  }

  return filtered as RestaurantWithRating[]
}

export async function getRestaurant(id: string): Promise<RestaurantDetail | null> {
  return await prisma.restaurant.findUnique({
    where: { id },
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
  }) as RestaurantDetail | null
}

export async function createRestaurant(data: RestaurantInput): Promise<ActionResult<Restaurant>> {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate with Zod schema
  const validation = restaurantSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message }
  }

  try {
    const restaurant = await prisma.restaurant.create({
      data: {
        title: validation.data.title,
        description: validation.data.description,
        location: validation.data.location,
        cuisine: validation.data.cuisine,
        imageUrl: validation.data.imageUrl || '/restaurant1.jpg',
        ownerId: user.id
      }
    })

    revalidatePath('/')
    return { success: true, data: restaurant }
  } catch (error: any) {
    console.error('Create restaurant error:', error)
    return { success: false, error: 'Failed to create restaurant' }
  }
}

export async function updateRestaurant(id: string, data: RestaurantInput): Promise<ActionResult<Restaurant>> {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id }
  })

  if (!restaurant || restaurant.ownerId !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate with Zod schema
  const validation = restaurantSchema.safeParse(data)

  if (!validation.success) {
    return { success: false, error: validation.error.errors[0].message }
  }

  try {
    // Delete old image if it's being replaced with a new uploaded image
    if (
      validation.data.imageUrl &&
      validation.data.imageUrl !== restaurant.imageUrl &&
      restaurant.imageUrl &&
      restaurant.imageUrl.startsWith('/uploads/')
    ) {
      await deleteImageAction(restaurant.imageUrl)
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        title: validation.data.title,
        description: validation.data.description,
        location: validation.data.location,
        cuisine: validation.data.cuisine,
        imageUrl: validation.data.imageUrl || restaurant.imageUrl || '/restaurant1.jpg',
      }
    })

    revalidatePath(`/owner/my-restaurants`)
    revalidatePath(`/reviewer/restaurants/${id}`)
    return { success: true, data: updatedRestaurant }
  } catch (error: any) {
    console.error('Update restaurant error:', error)
    return { success: false, error: 'Failed to update restaurant' }
  }
}

export async function deleteRestaurant(id: string): Promise<ActionResult> {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id }
  })

  if (!restaurant || restaurant.ownerId !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await prisma.restaurant.delete({
      where: { id }
    })

    revalidatePath('/')
    revalidatePath(`/owner/my-restaurants`)
    return { success: true }
  } catch (error) {
    console.error('Delete restaurant error:', error)
    return { success: false, error: 'Failed to delete restaurant' }
  }
}

type RestaurantWithReviews = Restaurant & {
  reviews: { rating: number }[]
}

export async function getMyRestaurants(): Promise<RestaurantWithReviews[]> {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'OWNER') {
    return []
  }

  return await prisma.restaurant.findMany({
    where: {
      ownerId: user.id
    },
    include: {
      reviews: {
        select: {
          rating: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
}

export async function uploadImageAction(formData: FormData): Promise<ActionResult<{ imageUrl: string }>> {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return { success: false, error: 'Unauthorized' }
  }

  const file = formData.get('image') as File

  if (!file) {
    return { success: false, error: 'No file provided' }
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    return { success: false, error: 'File too large. Maximum size is 5MB.' }
  }

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `restaurant-${timestamp}.${extension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Save to public/uploads/ directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const uploadPath = path.join(uploadDir, filename)

    await writeFile(uploadPath, buffer)

    // Return the URL path
    return { success: true, data: { imageUrl: `/uploads/${filename}` } }
  } catch (error) {
    console.error('Image upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

export async function deleteImageAction(imageUrl: string): Promise<ActionResult> {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return { success: false, error: 'Unauthorized' }
  }

  // Don't delete default images
  if (imageUrl.startsWith('/restaurant')) {
    return { success: true }
  }

  // Only delete images from /uploads/ directory
  if (!imageUrl.startsWith('/uploads/')) {
    return { success: true }
  }

  try {
    const filename = imageUrl.replace('/uploads/', '')
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename)

    await unlink(filePath)

    return { success: true }
  } catch (error) {
    console.error('Image delete error:', error)
    // Don't fail if file doesn't exist
    return { success: true }
  }
}