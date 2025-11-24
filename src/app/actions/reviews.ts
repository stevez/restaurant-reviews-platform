'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { getCurrentUser } from './auth'
import { Review } from '@prisma/client'

export async function createReview(
  restaurantId: string,
  rating: number,
  comment?: string
): Promise<{ error: string } | { success: true; review: Review }> {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'REVIEWER') {
    return { error: 'Unauthorized' }
  }

  // Check if user already reviewed this restaurant
  const existingReview = await prisma.review.findUnique({
    where: {
      restaurantId_userId: {
        restaurantId,
        userId: user.id
      }
    }
  })

  if (existingReview) {
    return { error: 'You have already reviewed this restaurant' }
  }

  try {
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        restaurantId,
        userId: user.id
      }
    })

    revalidatePath(`/reviewer/restaurants/${restaurantId}`)
    return { success: true, review }
  } catch (error) {
    console.error('Create review error:', error)
    return { error: 'Failed to create review' }
  }
}

export async function updateReview(
  reviewId: string,
  rating: number,
  comment?: string
): Promise<{ error: string } | { success: true; review: Review }> {
  const user = await getCurrentUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  })

  if (!review || review.userId !== user.id) {
    return { error: 'Unauthorized' }
  }

  try {
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment
      }
    })

    revalidatePath(`/reviewer/restaurants/${review.restaurantId}`)
    return { success: true, review: updated }
  } catch (error) {
    console.error('Update review error:', error)
    return { error: 'Failed to update review' }
  }
}

export async function deleteReview(reviewId: string): Promise<{ error: string } | { success: true }> {
  const user = await getCurrentUser()
  
  if (!user) {
    return { error: 'Unauthorized' }
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  })

  if (!review || review.userId !== user.id) {
    return { error: 'Unauthorized' }
  }

  try {
    await prisma.review.delete({
      where: { id: reviewId }
    })

    revalidatePath(`/reviewer/restaurants/${review.restaurantId}`)
    return { success: true }
  } catch (error) {
    console.error('Delete review error:', error)
    return { error: 'Failed to delete review' }
  }
}

export async function getMyReview(restaurantId: string): Promise<Review | null> {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }

  return await prisma.review.findUnique({
    where: {
      restaurantId_userId: {
        restaurantId,
        userId: user.id
      }
    }
  })
}