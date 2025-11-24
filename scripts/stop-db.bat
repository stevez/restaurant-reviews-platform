@echo off
REM Stop the PostgreSQL database Docker container

echo 🛑 Stopping PostgreSQL database...
docker-compose down

echo ✅ Database stopped successfully!
