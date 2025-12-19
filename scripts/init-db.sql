-- Database initialization script
-- This script creates the database schema using Prisma migrations
-- Note: Prisma will handle the actual schema creation via migrations

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary privileges
GRANT ALL PRIVILEGES ON DATABASE restaurant_reviews TO restaurant_user;

-- Note: Run `npm run db:migrate` after the container is up to create tables
