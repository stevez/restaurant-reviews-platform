# Architecture Documentation

## Overview

This is a full-stack restaurant review platform built with modern web technologies. The application follows a layered architecture pattern with clear separation of concerns between presentation, business logic, and data access layers.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **Form Management**: React Hook Form
- **Client-side Validation**: Zod

### Backend
- **Runtime**: Node.js
- **API Pattern**: Next.js Server Actions
- **Database ORM**: Prisma 5
- **Database**: PostgreSQL 16
- **Authentication**: JWT with jose library
- **Password Hashing**: bcryptjs

### Testing
- **Framework**: Jest
- **React Testing**: React Testing Library
- **Coverage**: 313 tests across all layers

### DevOps
- **Containerization**: Docker (PostgreSQL)
- **Version Control**: Git
- **Package Manager**: npm

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Pages, Components, UI Elements)       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│    (Server Actions, Validators)         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│      (Prisma ORM, Database)             │
└─────────────────────────────────────────┘
```

### 2. Next.js App Router Structure

The application uses Next.js 14's App Router with the following conventions:

- **Route Groups**: `(auth)` for authentication pages
- **Dynamic Routes**: `[id]` for restaurant and review details
- **Server Components**: Default for all pages (better performance)
- **Client Components**: Only when interactivity is required (`'use client'`)

### 3. Authentication Flow

```
User Login
    ↓
Credentials Validated (Server Action)
    ↓
JWT Token Generated (jose)
    ↓
Token Stored in HTTP-Only Cookie
    ↓
Middleware Validates Token on Protected Routes
    ↓
User Session Available via getCurrentUser()
```

**Security Features**:
- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiration
- HTTP-only cookies prevent XSS attacks
- Server-side authorization checks on all mutations
- Input validation with Zod schemas

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group for auth pages
│   │   ├── login/               # Login page
│   │   └── register/            # Registration page
│   ├── owner/                    # Restaurant owner routes
│   │   ├── [id]/                # Dynamic restaurant routes
│   │   │   ├── edit/           # Edit restaurant
│   │   │   └── reviews/        # View restaurant reviews
│   │   ├── create/             # Create new restaurant
│   │   └── my-restaurants/     # List owner's restaurants
│   ├── reviewer/                 # Reviewer routes
│   │   └── restaurants/        # Browse and review restaurants
│   │       └── [id]/          # Restaurant detail page
│   ├── actions/                  # Server Actions (API layer)
│   │   ├── auth.ts             # Authentication actions
│   │   ├── restaurants.ts      # Restaurant CRUD actions
│   │   └── reviews.ts          # Review actions
│   ├── api/                      # REST API endpoints
│   │   └── auth/               # Auth API routes
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── middleware.ts            # Route protection
├── components/                   # React components
│   ├── filters/                 # Filter panel for restaurants
│   ├── restaurants/             # Restaurant components
│   │   ├── RestaurantCard.tsx  # Restaurant card display
│   │   ├── RestaurantForm.tsx  # Create/edit form
│   │   ├── RestaurantGrid.tsx  # Grid layout
│   │   └── ImageUploader.tsx   # Image upload component
│   ├── reviews/                 # Review components
│   │   └── ReviewForm.tsx      # Review submission form
│   └── ui/                      # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── StarRating.tsx
│       └── ErrorMessage.tsx
├── lib/                          # Utility libraries
│   ├── auth.ts                  # JWT utilities
│   ├── auth.server.ts           # Server-side auth helpers
│   ├── constants.ts             # App constants
│   ├── db.ts                    # Prisma client
│   ├── utils.ts                 # Helper functions
│   └── validators.ts            # Zod schemas
├── types/                        # TypeScript definitions
└── middleware.ts                 # Next.js middleware
prisma/
├── schema.prisma                 # Database schema
└── seed.js                       # Seed data
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐           ┌──────────────┐
│    User     │           │  Restaurant  │
├─────────────┤           ├──────────────┤
│ id (PK)     │◄──────────┤ id (PK)      │
│ email       │  1     N  │ title        │
│ password    │   owns    │ description  │
│ name        │           │ location     │
│ role        │           │ cuisine[]    │
│ createdAt   │           │ imageUrl     │
│ updatedAt   │           │ ownerId (FK) │
└─────────────┘           │ createdAt    │
      │                   │ updatedAt    │
      │                   └──────────────┘
      │                         │
      │ writes                  │ belongs to
      │ N                       │ N
      │                         │
      ▼                         ▼
┌─────────────┐           ┌──────────────┐
│   Review    │───────────┤              │
├─────────────┤   N    1  │              │
│ id (PK)     │           │              │
│ rating      │           │              │
│ comment     │           │              │
│ userId (FK) │           │              │
│ restaurantId│           │              │
│ createdAt   │           │              │
│ updatedAt   │           │              │
└─────────────┘           └──────────────┘

Constraints:
- One user can own many restaurants
- One restaurant can have many reviews
- One user can write many reviews
- One review belongs to one user and one restaurant
- UNIQUE(restaurantId, userId) - One review per restaurant per user
```

### Database Models

**User**
- Role-based access control (REVIEWER | OWNER)
- Cascade delete: Deleting a user deletes their restaurants and reviews

**Restaurant**
- Array field for cuisine types (PostgreSQL array)
- Optional image URL
- Cascade delete: Deleting a restaurant deletes all its reviews

**Review**
- Rating: 1-5 stars (integer)
- Optional comment (text)
- Composite unique constraint: One review per user per restaurant

## Key Features & Implementation

### 1. Filter Persistence

**Requirement**: "Filtering and sorting should be preserved when the user re-visits the website/app"

**Implementation**:
- Filters saved to `localStorage` when applied
- Filters loaded on component mount if no URL params exist
- URL params take precedence (for sharing/bookmarking)
- Reset button clears localStorage

```typescript
// FilterPanel.tsx
const preferences = {
  cuisines: selectedCuisines,
  minRating,
  sort: sortOrder,
  location: selectedLocation,
}
localStorage.setItem('restaurant_filter_preferences', JSON.stringify(preferences))
```

### 2. Role-Based Access Control

**Owner Permissions**:
- Create, read, update, delete own restaurants
- View reviews on own restaurants
- Cannot review restaurants
- Cannot modify other owners' restaurants

**Reviewer Permissions**:
- Browse all restaurants
- Filter and sort restaurants
- Create, update, delete own reviews
- One review per restaurant
- Cannot create restaurants

**Implementation**:
```typescript
// Server-side authorization check
const user = await getCurrentUser()
const restaurant = await prisma.restaurant.findUnique({ where: { id } })

if (restaurant.ownerId !== user.id) {
  return { error: 'Unauthorized' }
}
```

### 3. Server Actions Pattern

Instead of traditional REST APIs, this application uses Next.js Server Actions for a simpler, type-safe API layer.

**Benefits**:
- Automatic type inference (no manual API types)
- No need for separate API route files
- Built-in request deduplication
- Integrated with React Server Components

**Example**:
```typescript
// app/actions/restaurants.ts
'use server'

export async function createRestaurant(formData: FormData) {
  // Runs on server only
  const user = await getCurrentUser()
  // Validation, authorization, database operations
  revalidatePath('/owner/my-restaurants')
  return { success: true, restaurant }
}

// Component usage
import { createRestaurant } from '@/app/actions/restaurants'

async function handleSubmit(formData: FormData) {
  const result = await createRestaurant(formData)
  if (result.success) {
    router.push('/owner/my-restaurants')
  }
}
```

### 4. Image Upload Handling

**Two modes**:
- **Seed data**: Uses external Unsplash URLs
- **User uploads**: Saved to `/public/uploads/`

**Implementation**:
- Client-side validation (file type, size)
- Server-side validation
- FormData for multipart upload
- Next.js `<Image>` component for optimization

### 5. Input Validation

**Three-layer validation**:

1. **Client-side** (HTML5 + React Hook Form)
2. **Schema validation** (Zod)
3. **Business logic** (Server Actions)

```typescript
// lib/validators.ts
export const restaurantSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(1, 'Location is required'),
  cuisine: z.array(z.string()).min(1, 'Select at least one cuisine'),
  imageUrl: z.string().url().optional().or(z.literal('')),
})
```

### 6. Responsive Design

**Mobile-first approach** with Tailwind CSS breakpoints:

- `sm`: 640px (tablet)
- `md`: 768px (desktop)
- `lg`: 1024px (large desktop)

**Key responsive patterns**:
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Typography: `text-base md:text-lg lg:text-xl`
- Layout: `flex-col md:flex-row`

### 7. State Management

**No global state library needed**:
- Server state: React Server Components
- Form state: React Hook Form
- UI state: React useState
- URL state: Next.js searchParams
- Persistent state: localStorage

## Performance Optimizations

### 1. Server Components
- Default rendering mode for all pages
- Reduces JavaScript bundle size
- Better SEO and initial page load

### 2. Image Optimization
- Next.js `<Image>` component
- Automatic lazy loading
- Responsive srcset generation
- WebP format conversion

### 3. Code Splitting
- Automatic with Next.js App Router
- Each route only loads required JavaScript
- Client components are separate chunks

### 4. Database Query Optimization
- Prisma select/include for specific fields
- Indexed fields (userId, restaurantId)
- Composite indexes for unique constraints

### 5. Caching Strategy
- Next.js automatic route caching
- `revalidatePath()` for targeted cache invalidation
- localStorage for filter persistence

## Security Considerations

### 1. Authentication
- JWT tokens with expiration
- HTTP-only cookies prevent XSS
- Secure password hashing (bcrypt, 10 rounds)

### 2. Authorization
- Server-side checks on all mutations
- User cannot modify other users' data
- Role-based access control

### 3. Input Validation
- Zod schemas validate all inputs
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React auto-escaping)

### 4. CSRF Protection
- Next.js Server Actions have built-in CSRF protection
- Origin checking on mutations

### 5. Environment Variables
- Sensitive data in `.env`
- Never committed to version control
- Different values for dev/prod

## Testing Strategy

### Test Coverage

```
Total: 313 tests
├── Unit Tests: ~200 tests
│   ├── Server Actions
│   ├── Validators
│   ├── Auth utilities
│   └── Helper functions
├── Integration Tests: ~80 tests
│   ├── Components
│   └── Pages
└── E2E-style Tests: ~33 tests
    └── Full page flows
```

### Testing Patterns

**Component Testing**:
```typescript
it('should render restaurant card with all details', () => {
  render(<RestaurantCard {...mockRestaurant} />)

  expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
  expect(screen.getByText('Italian')).toBeInTheDocument()
  expect(screen.getByAltText('Test Restaurant')).toBeInTheDocument()
})
```

**Server Action Testing**:
```typescript
it('should create restaurant successfully', async () => {
  mockGetCurrentUser.mockResolvedValue(mockOwner)

  const result = await createRestaurant(validFormData)

  expect(result.success).toBe(true)
  expect(prismaMock.restaurant.create).toHaveBeenCalled()
})
```

## Deployment Considerations

### Environment Variables

Required for production:
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="<secure-random-string>"
NODE_ENV="production"
NEXTAUTH_URL="https://yourdomain.com"
```

### Database Migration

```bash
# Apply migrations
npx prisma migrate deploy

# Seed initial data (optional)
npm run db:seed
```

### Build Process

```bash
# Install dependencies
npm ci

# Build for production
npm run build

# Start production server
npm start
```

### Hosting Recommendations

**Recommended platforms**:
- **Vercel**: Optimized for Next.js (zero-config)
- **Railway**: Includes PostgreSQL
- **Render**: Full-stack hosting
- **AWS/GCP**: For enterprise needs

**Database hosting**:
- **Vercel Postgres**: Integrated with Vercel
- **Railway**: Built-in PostgreSQL
- **Supabase**: Managed PostgreSQL
- **AWS RDS**: Production-grade PostgreSQL

## Future Enhancements

### Potential Features
1. **Real-time updates**: WebSocket for live review notifications
2. **Advanced search**: Full-text search with PostgreSQL
3. **Geolocation**: Map view and distance-based filtering
4. **Email notifications**: Notify owners of new reviews
5. **Social features**: Follow reviewers, like reviews
6. **Analytics dashboard**: Review trends, popular restaurants
7. **Multi-language**: i18n support
8. **Mobile app**: React Native version

### Technical Improvements
1. **Incremental Static Regeneration**: Cache popular restaurant pages
2. **Edge Functions**: Move auth checks to edge for lower latency
3. **Redis caching**: Cache restaurant listings
4. **CDN integration**: Cloudflare for static assets
5. **Monitoring**: Sentry for error tracking, DataDog for metrics
6. **CI/CD**: GitHub Actions for automated testing/deployment

## Conclusion

This application demonstrates modern full-stack development practices with a focus on:
- Type safety (TypeScript, Zod, Prisma)
- Security (JWT, bcrypt, authorization)
- Performance (Server Components, caching, optimization)
- Developer experience (Server Actions, hot reload, testing)
- Code quality (ESLint, Prettier, comprehensive tests)

The architecture is scalable, maintainable, and follows industry best practices for production web applications.
