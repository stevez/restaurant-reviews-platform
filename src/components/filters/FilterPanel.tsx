'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CUISINE_TYPES, MIN_RATING_FILTERS, SORT_OPTIONS, CITIES, SortOrder, CuisineType } from '@/lib/constants'
import { Button } from '@/components/ui'
import { savedPreferencesSchema } from '@/lib/validators';

const FILTER_PREFERENCES_KEY = 'restaurant_filter_preferences'

export interface FilterPanelProps {
  initialCuisines?: CuisineType[]
  initialMinRating?: number
  initialSort?: SortOrder,
  initialLocation?: string
}

interface SavedFilterPreferences {
  cuisines?: CuisineType[]
  minRating?: number
  sort?: SortOrder
  location?: string
}

export function FilterPanel({
  initialCuisines = [],
  initialMinRating = 0,
  initialSort = 'best',
  initialLocation = '',
}: FilterPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Load saved filter preferences from localStorage
  const getSavedPreferences = (): SavedFilterPreferences | null => {
    try {
      const saved = localStorage.getItem(FILTER_PREFERENCES_KEY)
      if(!saved) return null;
      const parsed = savedPreferencesSchema.safeParse(JSON.parse(saved))
      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  }

  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>(initialCuisines)
  const [minRating, setMinRating] = useState(initialMinRating)
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSort)
  const [selectedLocation, setSelectedLocation] = useState(initialLocation)

  // Load filter preferences on mount and apply them if no URL params present
  useEffect(() => {

    // Only load from localStorage if no URL params are present
    const hasUrlParams = initialCuisines.length > 0 || initialMinRating > 0 || initialSort !== 'best' || initialLocation !== ''

    if (!hasUrlParams) {
      const saved = getSavedPreferences()
      if (saved) {
        // Check if saved preferences exist
        const hasSavedPreferences =
          (saved.cuisines && saved.cuisines.length > 0) ||
          (saved.minRating && saved.minRating > 0) ||
          saved.sort ||
          saved.location

        if (hasSavedPreferences) {
          // Update local state with saved preferences
          if (saved.cuisines) setSelectedCuisines(saved.cuisines)
          if (saved.minRating) setMinRating(saved.minRating)
          if (saved.sort) setSortOrder(saved.sort)
          if (saved.location) setSelectedLocation(saved.location)

          // Build URL params from saved preferences
          const params = new URLSearchParams()

          if (saved.cuisines && saved.cuisines.length > 0) {
            params.set('cuisine', saved.cuisines.join(','))
          }
          if (saved.minRating && saved.minRating > 0) {
            params.set('minRating', saved.minRating.toString())
          }
          if (saved.location) {
            params.set('location', saved.location)
          }
          if (saved.sort) {
            params.set('sort', saved.sort)
          }

          // Navigate to URL with saved filters (only once on mount)
          const queryString = params.toString()
          if (queryString) {
            router.push(`/?${queryString}`)
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const handleCuisineToggle = (cuisine: CuisineType) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine]
    )
  }

  const handleApplyFilters = () => {
    // Save all filter preferences to localStorage
    const preferences: SavedFilterPreferences = {
        cuisines: selectedCuisines,
        minRating,
        sort: sortOrder,
        location: selectedLocation,
    }
    localStorage.setItem(FILTER_PREFERENCES_KEY, JSON.stringify(preferences))

    startTransition(() => {
      const params = new URLSearchParams()
      if (selectedCuisines.length > 0) {
        params.set('cuisine', selectedCuisines.join(','))
      }
      if (minRating > 0) {
        params.set('minRating', minRating.toString())
      }
      if (selectedLocation) {
        params.set('location', selectedLocation)
      }
      params.set('sort', sortOrder)

      const queryString = params.toString()
      router.push(queryString ? `/?${queryString}` : '/')
    })
  }

  const handleReset = () => {
    setSelectedCuisines([])
    setMinRating(0)
    setSortOrder('best')
    setSelectedLocation('')

    localStorage.removeItem(FILTER_PREFERENCES_KEY)

    startTransition(() => {
      router.push('/')
    })
  }

  const hasActiveFilters = selectedCuisines.length > 0 || minRating > 0 || selectedLocation !== ''

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h3 className="text-base md:text-lg font-semibold mb-3">Sort By</h3>
        <div className="space-y-2">
          {SORT_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="sort"
                value={option.value}
                checked={sortOrder === option.value}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="mr-2"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-base md:text-lg font-semibold mb-3">Minimum Rating</h3>
        <select
          value={minRating}
          onChange={(e) => setMinRating(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {MIN_RATING_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-base md:text-lg font-semibold mb-3">Location</h3>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Locations</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-base md:text-lg font-semibold mb-3">Cuisine</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {CUISINE_TYPES.map((cuisine) => (
            <label key={cuisine} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCuisines.includes(cuisine)}
                onChange={() => handleCuisineToggle(cuisine)}
                className="mr-2"
              />
              <span>{cuisine}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="pt-4 space-y-2">
        <Button
          onClick={handleApplyFilters}
          className="w-full"
          isLoading={isPending}
          disabled={isPending}
        >
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full"
            disabled={isPending}
          >
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  )
}
