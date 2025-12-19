import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRestaurant } from '@/app/actions/restaurants';
import { getCurrentUser } from '@/app/actions/auth';
import { getMyReview } from '@/app/actions/reviews';
import ReviewForm from '@/components/reviews/ReviewForm';
import { Button, StarRating } from '@/components/ui';
import { calculateAverageRating } from '@/lib/utils';

export default async function RestaurantDetailsPage({
  params
}: {
  params: { id: string }
}) {
  const [restaurant, user, myReview] = await Promise.all([
    getRestaurant(params.id),
    getCurrentUser(),
    getCurrentUser().then(u => u ? getMyReview(params.id) : null)
  ]);

  if (!restaurant) {
    notFound();
  }

  const averageRating = calculateAverageRating(restaurant.reviews);

  const isOwner = user?.role === 'OWNER' && user.id === restaurant.ownerId;

  return (
    <div className="px-4">
      <div className="mx-auto max-w-6xl mt-8 md:mt-16 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="font-bold text-2xl md:text-3xl text-gray-800">{restaurant.title}</h2>
          <div>
            <StarRating rating={averageRating} />
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2 flex-wrap">
            <Link href={`/owner/${restaurant.id}/edit`}>
              <Button size="sm" variant="secondary">Edit Restaurant</Button>
            </Link>
            <Link href={`/owner/${restaurant.id}/reviews`}>
              <Button size="sm" variant="outline">View All Reviews</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl text-gray-500 text-sm mb-4 font-semibold">
        {restaurant.location}
      </div>

      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="order-2 md:order-1">
          <p className="text-justify text-gray-800">
            {restaurant.description}
          </p>
        </div>
        <div className="order-1 md:order-2">
          <Image
            src={restaurant.imageUrl ?? '/restaurant1.jpg'}
            alt={restaurant.title}
            width={600}
            height={400}
            className="rounded-lg shadow-lg w-full h-auto"
          />
        </div>
      </div>

      <div className="mx-auto max-w-6xl my-6">
        <h2 className="font-semibold text-xl md:text-2xl text-gray-700 mb-4">Reviews</h2>

        {user?.role === 'REVIEWER' && (
          <ReviewForm
            restaurantId={params.id}
            existingReview={myReview}
          />
        )}

        <div className="my-6">
          {restaurant.reviews.map((review) => (
            <div key={review.id} className="p-4 my-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="leading-loose">
                  <div className="select-none">
                    <StarRating rating={review.rating} />
                  </div>
                </div>

                <div className="leading-loose text-xs sm:text-sm text-gray-600">
                  By <strong>{review.user.name}</strong> on{' '}
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="mt-2">
                {review.comment || 'No comment provided'}
              </div>
            </div>
          ))}

          { restaurant.reviews.length === 0 && (
            <div className="text-gray-500 py-8">
              No reviews yet.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}