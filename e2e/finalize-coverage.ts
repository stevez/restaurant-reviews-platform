/**
 * Manual coverage finalization script for IDE test runs
 *
 * Usage: npx ts-node e2e/finalize-coverage.ts
 *
 * Run this after executing tests from the IDE to generate coverage reports.
 */

import { finalizeCoverage } from 'nextcov/playwright'

async function main() {
  console.log('Finalizing coverage from IDE test run...\n')

  const result = await finalizeCoverage({
    outputDir: './coverage/e2e',
    reporters: ['html', 'lcov', 'text-summary'],
    cleanup: true,
  })

  if (result) {
    console.log('\nCoverage finalization complete!')
  } else {
    console.log('\nNo coverage data found. Make sure tests were run with coverage collection enabled.')
  }
}

main().catch(console.error)
