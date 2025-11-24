'use client'

import { useState, useRef } from 'react'
import { uploadImageAction } from '@/app/actions/restaurants'
import { Button } from '@/components/ui'
import Image from 'next/image'

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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
      return
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.')
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

      if ('error' in result) {
        setError(result.error)
        setPreview(currentImageUrl || null)
      } else {
        onImageChange(result.imageUrl)
        setPreview(result.imageUrl)
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
