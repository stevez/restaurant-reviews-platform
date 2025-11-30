'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRestaurant } from '@/app/actions/restaurants'
import { Button, ErrorMessage } from '@/components/ui'

export function DeleteRestaurantButton({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteRestaurant(restaurantId)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error)
      }
      setShowConfirm(false)
    })
  }

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="danger"
          onClick={handleDelete}
          isLoading={isPending}
          disabled={isPending}
        >
          Confirm
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <ErrorMessage message={error} />}
      <Button size="sm" variant="danger" onClick={() => setShowConfirm(true)}>
        Delete
      </Button>
    </div>
  )
}
