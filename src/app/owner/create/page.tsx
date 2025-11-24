'use client'

import { RestaurantForm } from '@/components/restaurants/RestaurantForm'

export default function AddRestaurantPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Add New Restaurant</h1>
          <p className="text-sm md:text-base text-gray-600">Create a new restaurant listing</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
          <RestaurantForm mode="create" />
        </div>
      </div>
    </div>
  )
}
