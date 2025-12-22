import { notFound } from 'next/navigation'
import { getRestaurant } from '@/app/actions/restaurants'
import { getCurrentUser } from '@/app/actions/auth'
import { RestaurantForm } from '@/components/restaurants/RestaurantForm'

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [restaurant, user] = await Promise.all([
    getRestaurant(id),
    getCurrentUser(),
  ])

  if (!restaurant) {
    notFound()
  }

  // Verify ownership
  if (!user || restaurant.ownerId !== user.id) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Edit Restaurant</h1>
          <p className="text-sm md:text-base text-gray-600">Update your restaurant information</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <RestaurantForm
            mode="edit"
            restaurantId={restaurant.id}
            initialData={{
              title: restaurant.title,
              description: restaurant.description,
              location: restaurant.location,
              cuisine: restaurant.cuisine,
              imageUrl: restaurant.imageUrl || '',
            }}
          />
        </div>
      </div>
    </div>
  )
}
