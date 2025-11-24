export const CUISINE_TYPES = [
  'Italian',
  'French',
  'Chinese',
  'Japanese',
  'Korean',
  'Thai',
  'Vietnamese',
  'Indian',
  'Mexican',
  'American',
  'Mediterranean',
  'Greek',
  'Spanish',
  'Middle Eastern',
  'Brazilian',
  'Other',
] as const

export const RATING_OPTIONS = [1, 2, 3, 4, 5] as const

export const CITIES = [
  'New York',
  'Los Angeles',
  'Chicago',
  'San Francisco',
  'Boston',
  'Miami',
  'Seattle',
  'Austin',
  'Portland',
  'Denver',
  'Toronto',
  'Other',
] as const

export const MIN_RATING_FILTERS = [
  { value: 0, label: 'All Ratings' },
  { value: 1, label: '1+ Stars' },
  { value: 2, label: '2+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 4, label: '4+ Stars' },
  { value: 5, label: '5 Stars' },
] as const

export const SORT_OPTIONS = [
  { value: 'best', label: 'Best Rated' },
  { value: 'worst', label: 'Worst Rated' },
] as const

export const JWT_EXPIRY_DAYS = 7
export const JWT_EXPIRY_SECONDS = JWT_EXPIRY_DAYS * 24 * 60 * 60

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MIN_IMAGE_WIDTH = 400
export const MIN_IMAGE_HEIGHT = 300

export const DEFAULT_ITEMS_PER_PAGE = 12

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You must be logged in to perform this action',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'An account with this email already exists',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  INVALID_EMAIL: 'Please enter a valid email address',
  REQUIRED_FIELD: 'This field is required',
  DUPLICATE_REVIEW: 'You have already reviewed this restaurant',
  IMAGE_TOO_LARGE: `Image must be less than ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
  INVALID_IMAGE_TYPE: 'Only JPEG, PNG, and WebP images are allowed',
  IMAGE_DIMENSIONS_TOO_SMALL: `Image must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px`,
  NETWORK_ERROR: 'Network error. Please try again.',
} as const

export const ROUTE_PATHS = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  REVIEWER_DASHBOARD: '/reviewer',
  REVIEWER_RESTAURANTS: '/reviewer/restaurants',
  OWNER_DASHBOARD: '/owner',
  OWNER_MY_RESTAURANTS: '/owner/my-restaurants',
  OWNER_CREATE: '/owner/create',
} as const
