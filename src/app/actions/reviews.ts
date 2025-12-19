'use server'

import { revalidatePath } from 'next/cache'
import { getPrisma } from '@/lib/db'
import { getCurrentUser } from './auth'
import { Review } from '@prisma/client'
import { reviewSchema } from '@/lib/validators'
import { type ActionResult } from '@/types/actions'

export async function createReview(
  restaurantId: string,
  rating: number,
  comment?: string
): Promise<ActionResult<Review>> {
  const validated = reviewSchema.safeParse({ rating, comment })

  if (!validated.success) {
    return { success: false, error: 'Invalid input', details: validated.error.errors }
  }

  const user = await getCurrentUser()

  if (!user || user.role !== 'REVIEWER') {
    return { success: false, error: 'Unauthorized' }
  }

  const prisma = getPrisma()

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
    return { success: false, error: 'You have already reviewed this restaurant' }
  }

  try {
    const review = await prisma.review.create({
      data: {
        rating: validated.data.rating,
        comment: validated.data.comment,
        restaurantId,
        userId: user.id
      }
    })

    revalidatePath(`/reviewer/restaurants/${restaurantId}`)
    return { success: true, data: review }
  } catch (error) {
    console.error('Create review error:', error)
    return { success: false, error: 'Failed to create review' }
  }
}

export async function updateReview(
  reviewId: string,
  rating: number,
  comment?: string
): Promise<ActionResult<Review>> {
  const validated = reviewSchema.safeParse({ rating, comment })

  if (!validated.success) {
    return { success: false, error: 'Invalid input', details: validated.error.errors }
  }

  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const prisma = getPrisma()
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  })

  if (!review || review.userId !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: validated.data.rating,
        comment: validated.data.comment
      }
    })

    revalidatePath(`/reviewer/restaurants/${review.restaurantId}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Update review error:', error)
    return { success: false, error: 'Failed to update review' }
  }
}

export async function deleteReview(reviewId: string): Promise<ActionResult> {
  const user = await getCurrentUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const prisma = getPrisma()
  const review = await prisma.review.findUnique({
    where: { id: reviewId }
  })

  if (!review || review.userId !== user.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await prisma.review.delete({
      where: { id: reviewId }
    })

    revalidatePath(`/reviewer/restaurants/${review.restaurantId}`)
    return { success: true }
  } catch (error) {
    console.error('Delete review error:', error)
    return { success: false, error: 'Failed to delete review' }
  }
}

export async function getMyReview(restaurantId: string): Promise<Review | null> {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const prisma = getPrisma()
  return await prisma.review.findUnique({
    where: {
      restaurantId_userId: {
        restaurantId,
        userId: user.id
      }
    }
  })
}