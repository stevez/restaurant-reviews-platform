'use client'

import { useState, useRef } from 'react'
import { uploadImageAction } from '@/app/actions/restaurants'
import { Button } from '@/components/ui'
import Image from 'next/image'
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, ERROR_MESSAGES } from '@/lib/constants'

interface ImageUploaderProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string) => void
  disabled?: boolean
}

export function ImageUploader({ currentImageUrl, onImageChange, disabled }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    // Client-side validation
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError(ERROR_MESSAGES.INVALID_IMAGE_TYPE)
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError(ERROR_MESSAGES.IMAGE_TOO_LARGE)
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const result = await uploadImageAction(formData)

      if (!result.success) {
        setError(result.error)
        setPreview(currentImageUrl || null)
      } else {
        onImageChange(result.data.imageUrl)
        setPreview(result.data.imageUrl)
      }
    } catch (err) {
      setError('Failed to upload image')
      setPreview(currentImageUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onImageChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Restaurant Image
        </label>

        {preview && (
          <div className="mb-4 relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="Restaurant preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
          >
            {isUploading ? 'Uploading...' : preview ? 'Change Image' : 'Upload Image'}
          </Button>

          {preview && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              Remove
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <p className="mt-2 text-sm text-gray-500">
          Upload a restaurant image (JPEG, PNG, or WebP, max 5MB)
        </p>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}
