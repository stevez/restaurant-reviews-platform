import Link from 'next/link'
import Image from 'next/image'
import { getMyRestaurants } from '@/app/actions/restaurants'
import { Button, StarRating } from '@/components/ui'
import { DeleteRestaurantButton } from './DeleteRestaurantButton'
import { calculateAverageRating } from '@/lib/utils'

export default async function MyRestaurantsPage() {
  const restaurants = await getMyRestaurants()

  // Calculate ratings for each restaurant
  const restaurantsWithRatings = restaurants.map((restaurant) => ({
    ...restaurant,
    averageRating: calculateAverageRating(restaurant.reviews),
    reviewCount: restaurant.reviews.length,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Restaurants</h1>
            <p className="text-gray-600">Manage your restaurant listings</p>
          </div>
          <Link href="/owner/create">
            <Button>Create New Restaurant</Button>
          </Link>
        </div>

        {restaurantsWithRatings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">You haven&apos;t created any restaurants yet</p>
            <Link href="/owner/create">
              <Button>Create Your First Restaurant</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {restaurantsWithRatings.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="md:flex">
                  {restaurant.imageUrl && (
                    <div className="md:w-48 h-48 relative overflow-hidden bg-gray-200">
                      <Image
                        src={restaurant.imageUrl}
                        alt={restaurant.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 192px"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl md:text-2xl font-semibold mb-2">{restaurant.title}</h2>
                        <p className="text-gray-600 mb-2">{restaurant.description}</p>
                        <p className="text-sm text-gray-500">
                          <span className="material-symbols-outlined text-sm align-middle">
                            location_on
                          </span>{' '}
                          {restaurant.location}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Link href={`/owner/${restaurant.id}/edit`}>
                          <Button size="sm" variant="secondary">
                            Edit
                          </Button>
                        </Link>
                        <DeleteRestaurantButton restaurantId={restaurant.id} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {restaurant.cuisine.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <StarRating
                        rating={restaurant.averageRating}
                        size="sm"
                        showRating
                        reviewCount={restaurant.reviewCount}
                      />

                      <Link href={`/owner/${restaurant.id}/reviews`}>
                        <Button size="sm" variant="outline">
                          View Reviews
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
