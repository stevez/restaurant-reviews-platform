// Desktop app (web-terrarium): the restaurant reviews app with its own PostgreSQL (PGlite), in one
// window. Run `npm run desktop:build`, which prepares the database files first (desktop/prepare.mjs).
export default {
  name: 'Restaurant Reviews',
  appId: 'com.stevez.restaurant-reviews',
  app: {
    type: 'next',
    env: {
      // connection_limit=1: PGlite runs one query at a time.
      DATABASE_URL:
        'postgresql://postgres:postgres@{host}:{port:db}/postgres?sslmode=disable&connection_limit=1',
      // Signs the login cookie of this local demo only; it never leaves the user's machine.
      JWT_SECRET: 'restaurant-reviews-desktop-demo',
    },
  },
  servers: [
    {
      name: 'db',
      label: 'database',
      entry: 'desktop/db-server.mjs',
      copy: ['generated'],
      env: { DB_PORT: '{port}', DB_HOST: '{host}' },
      // Postgres doesn't speak HTTP: ready once the port takes connections.
      ready: 'tcp',
    },
  ],
};
