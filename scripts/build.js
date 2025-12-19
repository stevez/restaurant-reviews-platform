#!/usr/bin/env node

const { execSync } = require('child_process');

// Always generate Prisma client
console.log('Generating Prisma Client...');
execSync('prisma generate', { stdio: 'inherit' });

// Only run migrations on Vercel (production/preview)
if (process.env.VERCEL === '1') {
  console.log('Running database migrations...');
  execSync('prisma migrate deploy', { stdio: 'inherit' });
}

// Build Next.js
console.log('Building Next.js application...');
execSync('next build', { stdio: 'inherit' });
