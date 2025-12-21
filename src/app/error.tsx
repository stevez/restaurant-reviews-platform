'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

function ErrorMessageBox({ message }: { message: string }) {
  if (!message) {
    return null
  }
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <p className="text-sm text-red-800 font-mono">{message}</p>
    </div>
  )
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console or error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-4">
          <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Please try again.
        </p>
        <ErrorMessageBox message={error.message} />
        <div className="space-y-2">
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
            className="w-full"
          >
            Go to homepage
          </Button>
        </div>
      </div>
    </div>
  )
}
