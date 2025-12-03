import { RestaurantGrid } from '@/components/restaurants/RestaurantGrid';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { getRestaurants } from '@/app/actions/restaurants';
import { type CuisineType, type SortOrder } from '@/lib/constants';

export const dynamic = 'force-dynamic';

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
  const cuisines = searchParams.cuisine?.split(',').filter(Boolean) as CuisineType[] | undefined;
  const minRating = searchParams.minRating ? Number(searchParams.minRating) : undefined;
  const sort: SortOrder | undefined =
    searchParams.sort === 'best' || searchParams.sort === 'worst'
      ? searchParams.sort
      : undefined;
  const location = searchParams.location || undefined;

  // Fetch restaurants using server action
  const restaurants = await getRestaurants({
    cuisines,
    minRating,
    sort,
    location
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar with filters */}
        <aside className="lg:col-span-1">
          <FilterPanel
            initialCuisines={cuisines ?? []}
            initialMinRating={minRating ?? 0}
            initialSort={sort ?? 'best'}
            initialLocation={location ?? ''}
          />
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3">
          <RestaurantGrid restaurants={restaurants} />
        </main>
      </div>
    </div>
  );
}
