#!/bin/bash

# Stop the PostgreSQL database Docker container

echo "🛑 Stopping PostgreSQL database..."

# Try docker compose (v2) first, fallback to docker-compose (v1)
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  docker compose down
elif command -v docker-compose &> /dev/null; then
  docker-compose down
else
  echo "❌ Error: Docker Compose not found. Please install Docker Desktop."
  exit 1
fi

echo "✅ Database stopped successfully!"
