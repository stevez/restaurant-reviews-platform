export interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showRating?: boolean
  reviewCount?: number
  className?: string
}

type SizeType = 'sm' | 'md' | 'lg'

const sizeClasses: Record<SizeType, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-2xl'
}

const textSizeClasses: Record<SizeType, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
}

function HalfStar({ hasHalfStar, size }: { hasHalfStar: boolean; size: SizeType }) {
  if (!hasHalfStar) {
    return null
  }
  return (
    <span
      className={`material-symbols-outlined text-yellow-400 ${sizeClasses[size]}`}
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      star_half
    </span>
  )
}

function RatingDisplay({ showRating, rating, size }: { showRating: boolean; rating: number; size: SizeType }) {
  if (!showRating) {
    return null
  }
  return (
    <span className={`font-semibold ${textSizeClasses[size]}`}>
      {rating > 0 ? rating.toFixed(1) : 'No ratings'}
    </span>
  )
}

function ReviewCountDisplay({ reviewCount, size }: { reviewCount?: number; size: SizeType }) {
  if (reviewCount === undefined) {
    return null
  }
  return (
    <span className={`text-gray-500 ${textSizeClasses[size]}`}>
      ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
    </span>
  )
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
        <HalfStar hasHalfStar={hasHalfStar} size={size} />
        {[...Array(emptyStars)].map((_, i) => (
          <span
            key={`empty-${i}`}
            className={`material-symbols-outlined text-gray-300 ${sizeClasses[size]}`}
          >
            star
          </span>
        ))}
      </div>
      <RatingDisplay showRating={showRating} rating={rating} size={size} />
      <ReviewCountDisplay reviewCount={reviewCount} size={size} />
    </div>
  )
}
