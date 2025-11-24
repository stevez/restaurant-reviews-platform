#!/usr/bin/env node

const { execSync } = require('child_process');
const { platform } = require('os');

function exec(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`❌ Error executing: ${command}`);
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkDockerHealth() {
  let retries = 30;
  while (retries > 0) {
    try {
      execSync('docker exec restaurant-reviews-db pg_isready -U restaurant_user -d restaurant_reviews', { stdio: 'ignore' });
      return true;
    } catch (error) {
      console.log('   Database is unavailable - waiting...');
      await sleep(2000);
      retries--;
    }
  }
  throw new Error('Database failed to become ready');
}

async function main() {
  console.log('🐳 Starting PostgreSQL database with Docker Compose...');

  // Try docker compose (v2) first, fallback to docker-compose (v1)
  try {
    exec('docker compose version', { stdio: 'ignore' });
    exec('docker compose up -d');
  } catch (error) {
    try {
      exec('docker-compose up -d');
    } catch (error) {
      console.error('❌ Error: Docker Compose not found. Please install Docker Desktop.');
      process.exit(1);
    }
  }

  console.log('⏳ Waiting for database to be ready...');
  await sleep(5000);

  console.log('🔍 Checking database health...');
  await checkDockerHealth();

  console.log('✅ Database is ready!');

  console.log('🔄 Running Prisma migrations...');
  exec('npm run db:push');

  console.log('🌱 Seeding database with sample data...');
  exec('npm run db:seed');

  console.log('🎉 Database setup complete!');
  console.log('');
  console.log('📝 Test credentials:');
  console.log('   Owner 1: owner1@example.com / password123');
  console.log('   Owner 2: owner2@example.com / password123');
  console.log('   Reviewer 1: reviewer1@example.com / password123');
  console.log('   Reviewer 2: reviewer2@example.com / password123');
  console.log('   Reviewer 3: reviewer3@example.com / password123');
  console.log('');
  console.log('🔗 Database connection: postgresql://restaurant_user:restaurant_password@localhost:5433/restaurant_reviews');
  console.log('💡 Run \'npm run db:studio\' to open Prisma Studio');
}

main().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});
