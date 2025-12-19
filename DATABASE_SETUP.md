# Database Setup Guide

This guide explains how to set up the PostgreSQL database for the Restaurant Reviews application using Docker.

## Prerequisites

- Docker Desktop installed and running
- Node.js and npm installed
- Git Bash (for Windows users, to run `.sh` scripts)

## Quick Start

### Option 1: Using the Automated Script (Recommended)

#### On Windows:
```bash
# Using Git Bash
bash scripts/start-db.sh

# Or using Command Prompt
scripts\start-db.bat
```

#### On macOS/Linux:
```bash
chmod +x scripts/start-db.sh
./scripts/start-db.sh
```

This script will:
1. Start the PostgreSQL Docker container
2. Wait for the database to be ready
3. Run Prisma migrations to create tables
4. Seed the database with sample data

### Option 2: Manual Setup

1. **Start the Docker container:**
   ```bash
   docker-compose up -d
   ```

2. **Wait for the database to be ready:**
   ```bash
   # Check if database is ready
   docker exec restaurant-reviews-db pg_isready -U restaurant_user -d restaurant_reviews
   ```

3. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Run Prisma migrations:**
   ```bash
   npm run db:push
   ```

5. **Seed the database:**
   ```bash
   npm run db:seed
   ```

## Database Credentials

The Docker setup uses the following credentials:

- **Host:** localhost
- **Port:** 5432
- **Database:** restaurant_reviews
- **Username:** restaurant_user
- **Password:** restaurant_password
- **Connection String:** `postgresql://restaurant_user:restaurant_password@localhost:5432/restaurant_reviews?schema=public`

## Test User Accounts

After seeding, you can log in with these test accounts:

| Role | Name | Email | Password |
|------|------|-------|----------|
| Owner | John Smith | owner1@example.com | Password123 |
| Owner | Sarah Johnson | owner2@example.com | Password123 |
| Reviewer | Mike Chen | reviewer1@example.com | Password123 |
| Reviewer | Emily Davis | reviewer2@example.com | Password123 |
| Reviewer | David Wilson | reviewer3@example.com | Password123 |

**Note:** All test accounts use the password: `Password123` (with capital P)

## Sample Data

The seed script creates:
- **5 users** (2 owners, 3 reviewers)
- **5 restaurants** with different cuisines
- **12 reviews** across various restaurants

## Available npm Scripts

- `npm run db:start` - Start database with Docker (runs migrations and seeding)
- `npm run db:stop` - Stop the database container
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## Managing the Database

### View Data with Prisma Studio
```bash
npm run db:studio
```
This opens a web interface at http://localhost:5555 where you can view and edit data.

### Stop the Database
```bash
# Using Git Bash (Windows) or macOS/Linux
bash scripts/stop-db.sh

# Using Command Prompt (Windows)
scripts\stop-db.bat

# Or manually
docker-compose down
```

### Reset the Database
To completely reset the database:
```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Start fresh
bash scripts/start-db.sh  # or scripts\start-db.bat on Windows
```

### Access Database Directly
```bash
# Connect to PostgreSQL CLI
docker exec -it restaurant-reviews-db psql -U restaurant_user -d restaurant_reviews

# Example queries
\dt              # List all tables
\d users         # Describe users table
SELECT * FROM users;
\q               # Quit
```

## Troubleshooting

### Port Already in Use
If port 5432 is already in use, you can either:
1. Stop the existing PostgreSQL service
2. Change the port in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Use port 5433 instead
   ```
   Then update your `DATABASE_URL` in `.env` accordingly.

### Container Won't Start
```bash
# Check Docker logs
docker logs restaurant-reviews-db

# Ensure Docker Desktop is running
docker ps
```

### Database Connection Issues
1. Verify the container is running:
   ```bash
   docker ps
   ```

2. Check database health:
   ```bash
   docker exec restaurant-reviews-db pg_isready -U restaurant_user -d restaurant_reviews
   ```

3. Verify your `.env` file has the correct `DATABASE_URL`

### Seed Data Not Appearing
```bash
# Re-run the seed script
npm run db:seed
```

## Development Workflow

1. **Start database:** `npm run db:start` (first time only)
2. **Make schema changes:** Edit `prisma/schema.prisma`
3. **Apply changes:** `npm run db:push`
4. **View changes:** `npm run db:studio`
5. **Run app:** `npm run dev`

## Production Deployment

For production, you should:
1. Use a managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)
2. Update `DATABASE_URL` environment variable
3. Run `npx prisma migrate deploy` instead of `db:push`
4. **Do not** run the seed script in production

## Docker Volume

The database data is persisted in a Docker volume named `postgres_data`. This means your data will survive container restarts. To completely remove the data:

```bash
docker-compose down -v
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
