import { prisma } from '@/lib/db';
import { RestaurantGrid } from '@/components/restaurants/RestaurantGrid';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { calculateAverageRating } from '@/lib/utils';

interface HomePageProps {
  searchParams: {
    cuisine?: string;
    minRating?: string;
    sort?: string;
    location?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Parse filters from URL
  const cuisineFilter = searchParams.cuisine?.split(',').filter(Boolean) || [];
  const minRating = searchParams.minRating ? Number(searchParams.minRating) : 0;
  const sortOrder = (searchParams.sort as 'best' | 'worst') || 'best';
  const locationFilter = searchParams.location || '';

  // Build where clause for filtering
  const whereClause: any = {};

  if (cuisineFilter.length > 0) {
    whereClause.cuisine = {
      hasSome: cuisineFilter
    };
  }

  if (locationFilter) {
    whereClause.location = {
      contains: locationFilter
    };
  }

  // Query restaurants with filters
  const restaurants = await prisma.restaurant.findMany({
    where: whereClause,
    include: {
      reviews: {
        select: {
          rating: true
        }
      }
    },
  });

  // Calculate average ratings and filter by minimum rating
  let restaurantsWithRatings = restaurants.map(restaurant => ({
    ...restaurant,
    averageRating: calculateAverageRating(restaurant.reviews),
    reviewCount: restaurant.reviews.length
  }));

  // Filter by minimum rating (done in-memory since it depends on calculated average)
  if (minRating > 0) {
    restaurantsWithRatings = restaurantsWithRatings.filter(
      restaurant => restaurant.averageRating >= minRating
    );
  }

  // Sort by average rating
  restaurantsWithRatings.sort((a, b) => {
    if (sortOrder === 'best') {
      return b.averageRating - a.averageRating; // Highest first
    } else {
      return a.averageRating - b.averageRating; // Lowest first
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar with filters */}
        <aside className="lg:col-span-1">
          <FilterPanel
            initialCuisines={cuisineFilter}
            initialMinRating={minRating}
            initialSort={sortOrder}
            initialLocation={locationFilter}
          />
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3">
          <RestaurantGrid restaurants={restaurantsWithRatings} />
        </main>
      </div>
    </div>
  );
}
