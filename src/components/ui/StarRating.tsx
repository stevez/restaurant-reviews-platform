export interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showRating?: boolean
  reviewCount?: number
  className?: string
}

export function StarRating({
  rating,
  size = 'md',
  showRating = false,
  reviewCount,
  className = ''
}: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="inline-flex select-none">
        {[...Array(fullStars)].map((_, i) => (
          <span
            key={`full-${i}`}
            className={`material-symbols-outlined text-yellow-400 ${sizeClasses[size]}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        ))}
        {hasHalfStar && (
          <span
            className={`material-symbols-outlined text-yellow-400 ${sizeClasses[size]}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star_half
          </span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span
            key={`empty-${i}`}
            className={`material-symbols-outlined text-gray-300 ${sizeClasses[size]}`}
          >
            star
          </span>
        ))}
      </div>
      {showRating && (
        <>
          <span className={`font-semibold ${textSizeClasses[size]}`}>
            {rating > 0 ? rating.toFixed(1) : 'No ratings'}
          </span>
          {reviewCount !== undefined && (
            <span className={`text-gray-500 ${textSizeClasses[size]}`}>
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </>
      )}
    </div>
  )
}
