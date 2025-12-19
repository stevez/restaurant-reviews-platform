# Restaurant Reviews Platform

> A production-ready, full-stack restaurant review application built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

[![CI](https://github.com/stevez/restaurant-reviews-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/stevez/restaurant-reviews-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Testing](#testing)
- [Deployment](#deployment)

## Overview

This application is a modern restaurant review platform that allows users to discover restaurants, leave reviews, and manage their dining experiences. Restaurant owners can create and manage their listings, while reviewers can browse, filter, and review restaurants.

**Key Highlights:**
- 🔐 Secure JWT authentication with role-based access control
- 🎨 Fully responsive design (mobile, tablet, desktop)
- 📊 Comprehensive filtering and sorting with persistence
- 🧪 Three-tier testing: Unit + Component + E2E (~88% merged coverage)
- 📈 E2E coverage collection with [nextcov](https://github.com/stevez/nextcov)
- 🚀 Built with Next.js 14 App Router and Server Actions
- 💾 PostgreSQL database with Prisma ORM
- ✅ Full TypeScript coverage with Zod validation

## Features

### Core Functionality

✅ **User Authentication**
- Email/password registration and login
- JWT token-based authentication
- HTTP-only cookies for security
- Role selection (Reviewer or Owner)

✅ **Restaurant Owners**
- Create, read, update, delete own restaurants
- Upload restaurant images (with validation)
- View all reviews on their restaurants
- Cannot modify other owners' restaurants

✅ **Reviewers**
- Browse all restaurants with filtering
- Filter by cuisine type and minimum rating
- Sort by best/worst rated
- Leave star ratings (1-5) with comments
- One review per restaurant
- Edit/delete own reviews

✅ **Filter Persistence**
- Filters and sorting saved to localStorage
- Restored when user returns to the site
- URL-based filtering for sharing

✅ **Responsive Design**
- Mobile-first approach with Tailwind CSS
- Adapts to all screen sizes
- Touch-friendly interfaces

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Server Actions
- **Database:** PostgreSQL (Docker)
- **ORM:** Prisma
- **Authentication:** JWT with bcryptjs
- **Form Validation:** React Hook Form + Zod
- **Testing:** Vitest (unit + component), Playwright (E2E), nextcov (coverage)

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com/)

## Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/))

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd restaurant-reviews-platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env if needed (default values work for local development)

# 4. Set up database (Docker + migrations + seed data)
npm run db:setup

# 5. Start development server
npm run dev
```

The application will be available at **http://localhost:3000**

### Environment Variables

The `.env` file contains the following (default values work out-of-the-box):

```env
DATABASE_URL="postgresql://restaurant_user:restaurant_password@localhost:5433/restaurant_reviews?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-8f7d6e5c4b3a2918"
NODE_ENV="development"
NEXTAUTH_URL="http://localhost:3000"
```

⚠️ **Important**: Change `JWT_SECRET` in production!

## Test Accounts

After seeding, you can log in with these test accounts:

| Role | Name | Email | Password |
|------|------|-------|----------|
| Owner | John Smith | owner1@example.com | Password123 |
| Owner | Sarah Johnson | owner2@example.com | Password123 |
| Reviewer | Mike Chen | reviewer1@example.com | Password123 |
| Reviewer | Emily Davis | reviewer2@example.com | Password123 |
| Reviewer | David Wilson | reviewer3@example.com | Password123 |

## Available Scripts

### Development

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing

- `npm test` - Run unit + component tests with coverage
- `npm run test:unit` - Run unit tests only (jsdom)
- `npm run test:unit:ui` - Run unit tests with Vitest UI dashboard
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:component` - Run component tests (browser)
- `npm run test:component:headed` - Run component tests with visible browser

### E2E Testing & Coverage

- `npm run e2e` - Run E2E tests with coverage (setup db, run tests, teardown)
- `npm run e2e:headed` - Run E2E tests with visible browser
- `npm run e2e:ui` - Run E2E tests with Playwright UI
- `npm run coverage:merge` - Merge unit, component, and E2E coverage into single report

### Database

- `npm run db:setup` - Initial database setup (Docker + migrations + seed)
- `npm run db:start` - Start existing database container
- `npm run db:stop` - Stop database container
- `npm run db:reset` - Reset database (wipe all data and reseed)
- `npm run db:push` - Push Prisma schema changes
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio GUI

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages (login, register)
│   │   ├── owner/             # Owner dashboard and features
│   │   ├── reviewer/          # Reviewer pages
│   │   ├── actions/           # Server Actions
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── restaurants/       # Restaurant-related components
│   │   ├── reviews/           # Review components
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utility functions and configurations
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── validators.ts      # Zod schemas
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Database seeding script
├── scripts/                   # Database management scripts
├── docker-compose.yml         # Docker configuration
└── DATABASE_SETUP.md          # Detailed database documentation
```

## Database Management

### Viewing Data

Open Prisma Studio to view and edit data visually:

```bash
npm run db:studio
```

Access at [http://localhost:5555](http://localhost:5555)

### Resetting the Database

To start fresh with clean seed data:

```bash
npm run db:reset
```

**Warning:** This will delete all existing data!

### Stopping the Database

When you're done working:

```bash
npm run db:stop
```

The data persists in a Docker volume, so you can restart with `npm run db:start`

## Development Workflow

1. **Start the database** (first time only):
   ```bash
   npm run db:setup
   ```

2. **Daily development**:
   ```bash
   npm run db:start  # Start database
   npm run dev       # Start app
   ```

3. **When done**:
   ```bash
   npm run db:stop   # Stop database
   ```

## Features by Role

### Restaurant Owners

- Create and manage restaurants
- Upload restaurant images
- View reviews on their restaurants
- Edit/delete their own restaurants
- Cannot review restaurants

### Reviewers

- Browse all restaurants
- Filter by rating and cuisine
- Leave reviews and ratings
- Edit/delete their own reviews
- One review per restaurant

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed architecture, patterns, and design decisions
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Database setup and management guide
- **[Prisma Documentation](https://www.prisma.io/docs)** - ORM documentation
- **[Next.js Documentation](https://nextjs.org/docs)** - Framework documentation

## Testing

This project uses a **three-tier testing strategy** with **[Vitest](https://vitest.dev/)** for unit and component tests and **[Playwright](https://playwright.dev/)** for E2E tests, with coverage collection and merging powered by **[nextcov](https://github.com/stevez/nextcov)**.

### Test Types

| Test Type | Environment | Best For | Coverage Focus |
|-----------|-------------|----------|----------------|
| **Unit** | jsdom | Server actions, utilities, hooks | Business logic, validation |
| **Component** | Real browser (Playwright) | UI components, interactions | React components, browser APIs |
| **E2E** | Full Next.js server | User flows, pages | Server components, integration |

### Unit Tests (Vitest + jsdom)
Fast unit tests running in jsdom environment for server actions, utilities, and hooks.

```bash
# Run unit tests with coverage
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run with Vitest UI dashboard
npm run test:unit:ui
```

**Coverage contribution:**
- `src/app/actions/*` - Server Actions (~80%)
- `src/lib/*` - Utilities, auth, validators (~73%)
- `src/hooks/*` - Custom hooks (100%)

### Component Tests (Vitest + Playwright Browser)
Real browser tests using Vitest browser mode with Playwright. Components render in an actual browser with real DOM APIs, CSS, and user interactions.

```bash
# Run component tests (headless)
npm run test:component

# Run with visible browser for debugging
npm run test:component:headed
```

**Coverage contribution:**
- `src/components/auth/*` - LoginForm, RegisterForm, LogoutButton (100%)
- `src/components/filters/*` - FilterPanel (100%)
- `src/components/ui/*` - Button, Input, StarRating (100%)
- `src/components/restaurants/*` - RestaurantCard, RestaurantForm (~88%)
- `src/components/reviews/*` - ReviewForm (100%)

Screenshots are captured on test failures and saved to `__screenshots__/` folders next to test files.

### E2E Tests (Playwright)
Full end-to-end tests using Playwright that test the complete application including React Server Components, server actions, and user flows.

```bash
# Run E2E tests (sets up database, runs tests, tears down)
npm run e2e

# Run E2E tests with headed browser
npm run e2e:headed

# Run E2E tests with Playwright UI
npm run e2e:ui
```

**Coverage contribution:**
- `src/app/*/page.tsx` - All pages and layouts
- React Server Components
- Full authentication flows
- Database operations through the UI

### Coverage

This project uses **[nextcov](https://www.npmjs.com/package/nextcov)** to collect V8 coverage from all three test types and merge them into a unified report.

```bash
# Run all tests (unit + component)
npm test

# Run E2E tests (includes coverage collection)
npm run e2e

# Merge all coverage sources into a single report
npm run coverage:merge
```

**Coverage Output:**
- Unit test coverage: `coverage/unit/`
- Component test coverage: `coverage/component/`
- E2E test coverage: `coverage/e2e/`
- Merged coverage: `coverage/merged/` (HTML report at `coverage/merged/index.html`)

**Coverage by Test Type:**

| Test Type | Overall % | What It Covers |
|-----------|-----------|----------------|
| **Unit Tests** | ~47% | Server actions, lib utilities, hooks |
| **Component Tests** | ~36% | UI components (100% on tested components) |
| **E2E Tests** | ~52% | Pages, server components, user flows |
| **Merged** | **~88%** | Complete picture of your application |

**Why Three Test Types?**

Each test type excels at different aspects:

1. **Unit tests** - Fast, isolated tests for business logic that doesn't need a browser
2. **Component tests** - Real browser rendering for components that use browser APIs (localStorage, CSS, events)
3. **E2E tests** - Full integration testing including React Server Components which can't be unit tested

**Test Coverage Highlights:**
- ✅ V8 coverage provider for accurate source mapping
- ✅ Unit tests for all server actions and utilities
- ✅ Component tests for all interactive UI components
- ✅ E2E tests for server components and user flows
- ✅ Coverage merging with statement normalization
- ✅ Form validation tests at all levels
- ✅ Authentication and authorization tests

## Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Deployment Platforms

**Recommended:**
- **Vercel** - Zero-config deployment for Next.js
- **Railway** - Full-stack with built-in PostgreSQL
- **Render** - Easy full-stack hosting

### Production Environment Variables

Ensure these are set in your production environment:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="<secure-random-string-minimum-32-characters>"
NODE_ENV="production"
NEXTAUTH_URL="https://yourdomain.com"
```

### Database Migration

```bash
# Apply migrations in production
npx prisma migrate deploy

# (Optional) Seed initial data
npm run db:seed
```

## Troubleshooting

### Database Connection Issues

1. **Ensure Docker is running:**
   ```bash
   docker ps
   ```
   You should see `restaurant-reviews-db` container

2. **Check database health:**
   ```bash
   docker exec restaurant-reviews-db pg_isready -U restaurant_user -d restaurant_reviews
   ```

3. **Verify environment variables:**
   - Check `.env` file has correct `DATABASE_URL`
   - Port should be `5433` (not `5432`)

### Port Already in Use

If port 5433 is in use, either:
- Stop the service using that port
- Change the port in `docker-compose.yml` and `.env`

### Fresh Start

To completely reset everything:

```bash
npm run db:stop
docker volume rm steve-zhang_postgres_data
npm run db:setup
```

## Project Highlights

### Security Features
- 🔒 Password hashing with bcrypt (10 rounds)
- 🍪 HTTP-only cookies prevent XSS attacks
- 🔑 JWT tokens with 7-day expiration
- ✅ Server-side authorization on all mutations
- 🛡️ Input validation with Zod schemas
- 🚫 SQL injection prevention (Prisma parameterized queries)

### Performance Optimizations
- ⚡ React Server Components for better initial load
- 🖼️ Next.js Image optimization with lazy loading
- 📦 Automatic code splitting by route
- 💾 Strategic caching with revalidation
- 🔄 Filter persistence with localStorage

### Code Quality
- 📘 100% TypeScript coverage
- 🧪 Three-tier test suite (unit + component + E2E)
- 📏 ESLint + Prettier configuration
- 🏗️ Clean architecture with separation of concerns
- 📝 Inline documentation and comments

## Architecture Patterns

This application implements several industry-standard patterns:

- **Layered Architecture** - Separation of presentation, business logic, and data access
- **Server Actions** - Type-safe API layer without manual routes
- **Role-Based Access Control (RBAC)** - Owner and Reviewer roles with different permissions
- **Repository Pattern** - Prisma as data access abstraction
- **Form Validation** - Multi-layer validation (client + server)

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

## License

MIT License - feel free to use this project for learning and development purposes.

## Contact

For questions or feedback about this project, please open an issue in the repository.
