export default async function globalTeardown() {
  console.log('\n✅ E2E tests complete')
  // Teardown is handled by the separate teardown-db.ts script
}
