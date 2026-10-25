// The desktop app's database: PostgreSQL in WebAssembly (PGlite), served on the Postgres wire
// protocol so Prisma can connect as usual. web-terrarium bundles this file and copies
// desktop/generated/ (made by prepare.mjs) beside it. The data lives in memory, so every launch
// starts from the seed data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const generated = path.join(path.dirname(fileURLToPath(import.meta.url)), 'generated');
const read = (...parts) => fs.readFileSync(path.join(generated, ...parts));

// The bundle can't load these from node_modules, so pass them in.
const db = await PGlite.create({
  pgliteWasmModule: await WebAssembly.compile(read('pglite', 'pglite.wasm')),
  initdbWasmModule: await WebAssembly.compile(read('pglite', 'initdb.wasm')),
  fsBundle: new Blob([read('pglite', 'pglite.data')]),
});

const migrations = fs.readdirSync(path.join(generated, 'migrations')).sort();
for (const file of migrations) {
  await db.exec(read('migrations', file).toString('utf8'));
}
await db.exec(read('seed.sql').toString('utf8'));
console.log(`Applied ${migrations.length} migration(s) and the seed data`);

// Listen only once the data is in, so web-terrarium's TCP readiness check means "ready".
const server = new PGLiteSocketServer({
  db,
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
});
await server.start();
console.log(`Listening on ${process.env.DB_HOST ?? '127.0.0.1'}:${process.env.DB_PORT ?? 5432}`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
