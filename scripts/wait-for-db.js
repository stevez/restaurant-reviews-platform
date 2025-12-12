const { Client } = require('pg');

const TIMEOUT = 30000;
const INTERVAL = 1000;

async function waitForDb() {
  const start = Date.now();

  while (Date.now() - start < TIMEOUT) {
    try {
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      await client.connect();
      await client.end();
      console.log('Database is ready');
      return;
    } catch {
      console.log('Waiting for database...');
      await new Promise(resolve => setTimeout(resolve, INTERVAL));
    }
  }

  throw new Error('Database connection timeout after 30 seconds');
}

waitForDb().catch(err => {
  console.error(err.message);
  process.exit(1);
});
