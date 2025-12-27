'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRestaurant } from '@/app/actions/restaurants'
import { Button, ErrorMessage } from '@/components/ui'
import { useAsyncAction } from '@/hooks/useAsyncAction';

export function DeleteRestaurantButton({ restaurantId }: { restaurantId: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const { error, isPending, execute } = useAsyncAction(deleteRestaurant)

  const handleDelete = () => {
    execute({
      onSuccess: () => {
        router.refresh();
        setShowConfirm(false)
      },
      onError: () => {
        setShowConfirm(false);
      }
    })(restaurantId)
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

  const errorMessage = error ? <ErrorMessage message={error} /> : null;

  return (
    <div className="flex flex-col gap-2">
      {errorMessage}
      <Button size="sm" variant="danger" onClick={() => setShowConfirm(true)}>
        Delete
      </Button>
    </div>
  )
}
