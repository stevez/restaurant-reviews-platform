/**
 * Merge Coverage Script
 *
 * Merges unit test and e2e coverage into a single report.
 * Uses the nextcov library's mergeCoverage function.
 */

import * as path from 'path'
import {
  mergeCoverage,
  printCoverageSummary,
  printCoverageComparison,
} from 'nextcov'

const projectRoot = process.cwd()

const config = {
  unitCoveragePath: path.join(projectRoot, 'coverage/unit/coverage-final.json'),
  e2eCoveragePath: path.join(projectRoot, 'coverage/e2e/coverage-final.json'),
  outputDir: path.join(projectRoot, 'coverage/merged'),
}

async function main() {
  console.log('📊 Merging coverage reports...\n')

  const result = await mergeCoverage({
    unitCoveragePath: config.unitCoveragePath,
    e2eCoveragePath: config.e2eCoveragePath,
    outputDir: config.outputDir,
    projectRoot,
    verbose: true,
  })

  if (!result) {
    console.error('❌ Failed to merge coverage')
    process.exit(1)
  }

  console.log(`\n✅ Coverage reports generated at: ${config.outputDir}`)

  // Print merged summary
  printCoverageSummary(result.summary, 'Merged Coverage Summary')

  // Print comparison if unit tests are available
  if (result.unitSummary) {
    printCoverageComparison(result.unitSummary, result.e2eSummary, result.summary)
  }

  // List E2E-only files
  if (result.e2eOnlyFiles.length > 0) {
    console.log(`\n  E2E-only files (${result.e2eOnlyFiles.length}):`)
    for (const file of result.e2eOnlyFiles) {
      console.log(`    - ${file}`)
    }
  }
}

main().catch(console.error)
