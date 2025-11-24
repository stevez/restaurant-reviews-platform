#!/bin/bash

# Start the PostgreSQL database using Docker Compose
# This script starts the database and runs migrations + seeding

set -e

echo "🐳 Starting PostgreSQL database with Docker Compose..."

# Try docker compose (v2) first, fallback to docker-compose (v1)
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  docker compose up -d
elif command -v docker-compose &> /dev/null; then
  docker-compose up -d
else
  echo "❌ Error: Docker Compose not found. Please install Docker Desktop."
  exit 1
fi

echo "⏳ Waiting for database to be ready..."
sleep 5

# Wait for database to be healthy
echo "🔍 Checking database health..."
until docker exec restaurant-reviews-db pg_isready -U restaurant_user -d restaurant_reviews > /dev/null 2>&1; do
  echo "   Database is unavailable - waiting..."
  sleep 2
done

echo "✅ Database is ready!"

echo "🔄 Running Prisma migrations..."
npm run db:push

echo "🌱 Seeding database with sample data..."
npm run db:seed

echo "🎉 Database setup complete!"
echo ""
echo "📝 Test credentials:"
echo "   Owner 1: owner1@example.com / password123"
echo "   Owner 2: owner2@example.com / password123"
echo "   Reviewer 1: reviewer1@example.com / password123"
echo "   Reviewer 2: reviewer2@example.com / password123"
echo "   Reviewer 3: reviewer3@example.com / password123"
echo ""
echo "🔗 Database connection: postgresql://restaurant_user:restaurant_password@localhost:5433/restaurant_reviews"
echo "💡 Run 'npm run db:studio' to open Prisma Studio"
