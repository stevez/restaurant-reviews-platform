'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRestaurant } from '@/app/actions/restaurants'
import { Button } from '@/components/ui'

export function DeleteRestaurantButton({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRestaurant(restaurantId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error)
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
    <Button size="sm" variant="danger" onClick={() => setShowConfirm(true)}>
      Delete
    </Button>
  )
}
