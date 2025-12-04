import { CoverageReport, CoverageReportOptions } from 'monocart-coverage-reports'
import * as fs from 'fs'
import * as path from 'path'

async function mergeCoverage() {
  const coverageDir = path.join(process.cwd(), 'coverage')
  const unitCoverageJson = path.join(coverageDir, 'unit', 'coverage-final.json')
  const e2eRawDir = path.join(coverageDir, 'e2e', 'raw')
  const mergedDir = path.join(coverageDir, 'merged')

  // Check what coverage data is available
  const hasUnitCoverage = fs.existsSync(unitCoverageJson)
  const hasE2ECoverage = fs.existsSync(e2eRawDir)

  if (!hasUnitCoverage && !hasE2ECoverage) {
    console.log('No coverage data found. Run tests first.')
    process.exit(1)
  }

  console.log('Merging coverage reports...')
  console.log(`  Unit coverage: ${hasUnitCoverage ? 'found' : 'not found'}`)
  console.log(`  E2E coverage: ${hasE2ECoverage ? 'found' : 'not found'}`)

  const inputDir: string[] = []

  if (hasE2ECoverage) {
    inputDir.push(e2eRawDir)
  }

  const coverageOptions: CoverageReportOptions = {
    name: 'Merged Coverage Report',
    inputDir,
    outputDir: mergedDir,

    sourceFilter: (sourcePath: string) => {
      return sourcePath.includes('src/') && !sourcePath.includes('node_modules')
    },

    reports: ['v8', 'console-details', 'lcov'],
  }

  const report = new CoverageReport(coverageOptions)

  // Add Vitest coverage data if available (Istanbul format)
  if (hasUnitCoverage) {
    const istanbulData = JSON.parse(fs.readFileSync(unitCoverageJson, 'utf-8'))
    await report.add(istanbulData)
  }

  await report.generate()

  console.log(`\nMerged coverage report generated at: ${mergedDir}`)
}

mergeCoverage().catch((error) => {
  console.error('Failed to merge coverage:', error)
  process.exit(1)
})
