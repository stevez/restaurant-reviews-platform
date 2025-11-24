import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRestaurant } from '@/app/actions/restaurants'
import { getCurrentUser } from '@/app/actions/auth'
import { Button, StarRating } from '@/components/ui'
import { formatRelativeTime, calculateAverageRating } from '@/lib/utils'

export default async function RestaurantReviewsPage({ params }: { params: { id: string } }) {
  const [restaurant, user] = await Promise.all([
    getRestaurant(params.id),
    getCurrentUser(),
  ])

  if (!restaurant) {
    notFound()
  }

  // Verify ownership
  if (!user || restaurant.ownerId !== user.id) {
    notFound()
  }

  const averageRating = calculateAverageRating(restaurant.reviews)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/owner/my-restaurants">
            <Button variant="outline" size="sm">
              ← Back to My Restaurants
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{restaurant.title}</h1>
          <p className="text-gray-600 mb-4">{restaurant.description}</p>

          <div className="flex items-center gap-4 mb-4">
            <StarRating
              rating={averageRating}
              size="lg"
              showRating
              reviewCount={restaurant.reviews.length}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Customer Reviews</h2>

          {restaurant.reviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">No reviews yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Your restaurant will receive reviews from customers
              </p>
            </div>
          ) : (
            restaurant.reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{review.user.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatRelativeTime(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <StarRating rating={review.rating} size="sm" showRating />
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
