// Prepares the desktop app's database (run before `web-terrarium stage`; see desktop:build in
// package.json). Writes desktop/generated/, which db-server.mjs reads at start-up:
//   pglite/      PGlite's WebAssembly files, which the bundled db server can't find in node_modules
//   migrations/  the Prisma migrations' SQL, in order
//   seed.sql     the data prisma/seed.js creates, made by running it against a temporary PGlite
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { pgDump } from '@electric-sql/pglite-tools';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(import.meta.dirname, 'generated');
const require = createRequire(import.meta.url);

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer().on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

fs.rmSync(OUT, { recursive: true, force: true });

// 1. PGlite's WebAssembly files.
const pgliteDist = path.dirname(require.resolve('@electric-sql/pglite'));
fs.mkdirSync(path.join(OUT, 'pglite'), { recursive: true });
['pglite.wasm', 'pglite.data', 'initdb.wasm'].forEach((file) =>
  fs.copyFileSync(path.join(pgliteDist, file), path.join(OUT, 'pglite', file)),
);

// 2. The migrations, in the order Prisma applies them (folder names sort by time).
const migrationsDir = path.join(ROOT, 'prisma', 'migrations');
const migrations = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
fs.mkdirSync(path.join(OUT, 'migrations'), { recursive: true });
migrations.forEach((name) =>
  fs.copyFileSync(
    path.join(migrationsDir, name, 'migration.sql'),
    path.join(OUT, 'migrations', `${name}.sql`),
  ),
);

// 3. The seed data: run the real prisma/seed.js against a temporary PGlite, then dump the data.
const db = await PGlite.create();
for (const name of migrations) {
  await db.exec(fs.readFileSync(path.join(OUT, 'migrations', `${name}.sql`), 'utf8'));
}
const port = await freePort();
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' });
await server.start();
try {
  // Not execFileSync: the socket server runs in this process and must keep serving meanwhile.
  const seed = spawn(process.execPath, [path.join(ROOT, 'prisma', 'seed.js')], {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable&connection_limit=1`,
    },
  });
  const [code] = await once(seed, 'exit');
  if (code !== 0) throw new Error(`prisma/seed.js failed (exit code ${code})`);
} finally {
  await server.stop();
}
const dump = await pgDump({ pg: db, args: ['--data-only', '--inserts', '--no-owner'] });
fs.writeFileSync(path.join(OUT, 'seed.sql'), await dump.text());
await db.close();

console.log(`Prepared ${path.relative(ROOT, OUT)}: ${migrations.length} migration(s) and seed.sql`);
