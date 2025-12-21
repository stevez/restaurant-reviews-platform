import Link from 'next/link'
import Image from 'next/image'
import { StarRating } from '@/components/ui'
import { type CuisineType } from '@/lib/constants';

export interface RestaurantCardProps {
  id: string
  title: string
  description: string
  location: string
  cuisine: CuisineType[]
  imageUrl: string | null
  averageRating: number
  reviewCount: number
}

function CardImage({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  if (!imageUrl) {
    return null
  }
  return (
    <div className="h-48 relative overflow-hidden bg-gray-200">
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  )
}

function CuisineOverflow({ count }: { count: number }) {
  if (count <= 3) {
    return null
  }
  return (
    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
      +{count - 3}
    </span>
  )
}

export function RestaurantCard({
  id,
  title,
  description,
  location,
  cuisine,
  imageUrl,
  averageRating,
  reviewCount,
}: RestaurantCardProps) {

  return (
    <Link href={`/reviewer/restaurants/${id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <CardImage imageUrl={imageUrl} title={title} />
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg md:text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2 flex-1">{description}</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              <span className="material-symbols-outlined text-sm align-middle">location_on</span>{' '}
              {location}
            </p>
            <div className="flex flex-wrap gap-1">
              {cuisine.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {c}
                </span>
              ))}
              <CuisineOverflow count={cuisine.length} />
            </div>
            <StarRating
              rating={averageRating}
              size="sm"
              showRating
              reviewCount={reviewCount}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
