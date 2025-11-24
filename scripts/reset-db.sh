#!/bin/bash

# Reset the database by removing the volume and starting fresh
# WARNING: This will delete ALL data!

set -e

echo "⚠️  WARNING: This will delete all database data!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Aborted"
  exit 0
fi

echo "🛑 Stopping database..."

# Try docker compose (v2) first, fallback to docker-compose (v1)
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  DOCKER_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  DOCKER_CMD="docker-compose"
else
  echo "❌ Error: Docker Compose not found. Please install Docker Desktop."
  exit 1
fi

$DOCKER_CMD down -v

echo "🐳 Starting fresh database..."
$DOCKER_CMD up -d

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

echo "🎉 Database reset complete!"
echo ""
echo "📝 Test credentials:"
echo "   Owner 1: owner1@example.com / password123"
echo "   Owner 2: owner2@example.com / password123"
echo "   Reviewer 1: reviewer1@example.com / password123"
echo "   Reviewer 2: reviewer2@example.com / password123"
echo "   Reviewer 3: reviewer3@example.com / password123"
