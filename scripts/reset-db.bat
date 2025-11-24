@echo off
REM Reset the database by removing the volume and starting fresh
REM WARNING: This will delete ALL data!

echo ⚠️  WARNING: This will delete all database data!
set /p confirm="Are you sure you want to continue? (yes/no): "

if not "%confirm%"=="yes" (
    echo ❌ Aborted
    exit /b 0
)

echo 🛑 Stopping database...
docker-compose down -v

echo 🐳 Starting fresh database...
docker-compose up -d

echo ⏳ Waiting for database to be ready...
timeout /t 5 /nobreak > nul

:check_db
echo 🔍 Checking database health...
docker exec restaurant-reviews-db pg_isready -U restaurant_user -d restaurant_reviews > nul 2>&1
if %errorlevel% neq 0 (
    echo    Database is unavailable - waiting...
    timeout /t 2 /nobreak > nul
    goto check_db
)

echo ✅ Database is ready!

echo 🔄 Running Prisma migrations...
call npm run db:push

echo 🌱 Seeding database with sample data...
call npm run db:seed

echo 🎉 Database reset complete!
echo.
echo 📝 Test credentials:
echo    Owner 1: owner1@example.com / password123
echo    Owner 2: owner2@example.com / password123
echo    Reviewer 1: reviewer1@example.com / password123
echo    Reviewer 2: reviewer2@example.com / password123
echo    Reviewer 3: reviewer3@example.com / password123
