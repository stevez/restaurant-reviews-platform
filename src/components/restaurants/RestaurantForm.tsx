'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRestaurant, updateRestaurant } from '@/app/actions/restaurants'
import { restaurantSchema, type RestaurantInput } from '@/lib/validators'
import { CUISINE_TYPES, type CuisineType } from '@/lib/constants'
import { Button, Input, ErrorMessage } from '@/components/ui'
import { ImageUploader } from './ImageUploader'

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }
  return <p className="mt-1 text-sm text-red-600">{message}</p>
}

export interface RestaurantFormProps {
  mode: 'create' | 'edit'
  restaurantId?: string
  initialData?: RestaurantInput
}

export function RestaurantForm({ mode, restaurantId, initialData }: RestaurantFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<RestaurantInput>({
    resolver: zodResolver(restaurantSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      location: '',
      imageUrl: '',
      cuisine: [],
      ...initialData
    },
  })

  const cuisine = watch('cuisine')

  const handleCuisineToggle = (cuisineType: CuisineType) => {
    const currentCuisine = cuisine || []
    const newCuisine = currentCuisine.includes(cuisineType)
      ? currentCuisine.filter((c) => c !== cuisineType)
      : [...currentCuisine, cuisineType]
    setValue('cuisine', newCuisine, { shouldValidate: true })
  }

  const onSubmit = (data: RestaurantInput) => {
    startTransition(async () => {
      try {
        const result =
          mode === 'create'
            ? await createRestaurant(data)
            : await updateRestaurant(restaurantId!, data)

        if (result.success) {
          router.push('/owner/my-restaurants')
        } else {
          setError('root', { message: result.error })
        }
      } catch (err) {
        setError('root', { message: 'An unexpected error occurred' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.root?.message && <ErrorMessage message={errors.root.message} />}

      <div>
        <Input
          label="Restaurant Name"
          type="text"
          {...register('title')}
          disabled={isPending}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div>
        <Input
          label="Location"
          type="text"
          {...register('location')}
          disabled={isPending}
        />
        <FieldError message={errors.location?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cuisine Types (select at least one)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto border border-gray-300 rounded-md p-4">
          {CUISINE_TYPES.map((cuisineType) => (
            <label key={cuisineType} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={cuisine?.includes(cuisineType) || false}
                onChange={() => handleCuisineToggle(cuisineType)}
                className="mr-2"
                disabled={isPending}
              />
              <span className="text-sm">{cuisineType}</span>
            </label>
          ))}
        </div>
        <FieldError message={errors.cuisine?.message} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isPending}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <ImageUploader
        currentImageUrl={watch('imageUrl')}
        onImageChange={(imageUrl) => setValue('imageUrl', imageUrl, { shouldValidate: true })}
        disabled={isPending}
      />

      <div className="flex gap-4">
        <Button type="submit" isLoading={isPending} disabled={isPending} className="flex-1">
          {mode === 'create' ? 'Create Restaurant' : 'Update Restaurant'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
