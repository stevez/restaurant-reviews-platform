'use server'

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, ERROR_MESSAGES } from '@/lib/constants'
import { type ActionResult } from '@/types/actions'

export async function uploadImage(formData: FormData): Promise<ActionResult<{ imageUrl: string }>> {
  try {
    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: ERROR_MESSAGES.REQUIRED_FIELD }
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      return { success: false, error: ERROR_MESSAGES.IMAGE_TOO_LARGE }
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { success: false, error: ERROR_MESSAGES.INVALID_IMAGE_TYPE }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `restaurant-${timestamp}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Write file
    await writeFile(filepath, buffer)

    // Return public URL
    const imageUrl = `/uploads/${filename}`
    return { success: true, data: { imageUrl } }
  } catch (error) {
    console.error('Image upload error:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}
