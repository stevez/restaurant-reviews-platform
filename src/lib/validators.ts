import { z } from 'zod'

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['REVIEWER', 'OWNER']),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const restaurantSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  location: z.string().min(1, 'Location is required').max(500),
  cuisine: z.array(z.string()).min(1, 'At least one cuisine is required'),
  imageUrl: z
    .string()
    .refine(
      (val) => {
        // Allow empty string
        if (!val) return true

        // Check for valid image extensions
        const validExtensions = /\.(jpg|jpeg|png|webp)$/i

        // For relative paths starting with /
        if (val.startsWith('/')) {
          return validExtensions.test(val)
        }

        // For full URLs (https:// or http://)
        try {
          const url = new URL(val)
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            return false
          }
          // Check if URL ends with valid image extension
          return validExtensions.test(url.pathname)
        } catch {
          return false
        }
      },
      { message: 'Must be a valid image file (.jpg, .jpeg, .png, .webp)' }
    )
    .optional(),
})

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be between 1 and 5').max(5),
  comment: z.string().max(1000, 'Comment must be 1000 characters or less').optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RestaurantInput = z.infer<typeof restaurantSchema>
export type ReviewInput = z.infer<typeof reviewSchema>