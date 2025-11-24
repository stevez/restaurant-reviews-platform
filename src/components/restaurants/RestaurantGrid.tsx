import { RestaurantCard } from './RestaurantCard'

export interface Restaurant {
  id: string
  title: string
  description: string
  location: string
  cuisine: string[]
  imageUrl: string | null
  averageRating: number
  reviewCount: number
}

export interface RestaurantGridProps {
  restaurants: Restaurant[]
}

export function RestaurantGrid({ restaurants }: RestaurantGridProps) {
  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No restaurants found</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
      {restaurants.map((restaurant) => (
        <RestaurantCard key={restaurant.id} {...restaurant} />
      ))}
    </div>
  )
}
