/**
 * Bundle coverage reports into the Playwright report directory.
 * Runs after coverage:merge to add coverage reports not available during E2E tests.
 */
import { bundleCoverage } from 'coverage-single-html'
import * as fs from 'fs'
import * as path from 'path'

const reportDir = path.join(process.cwd(), 'playwright-report')

if (!fs.existsSync(reportDir)) {
  console.log('[BundleReports] Playwright report directory not found')
  process.exit(0)
}

// Coverage reports to bundle
const coverageReports = [
  { inputDir: 'coverage/unit', outputFile: 'unit-coverage.html', title: 'Unit Coverage' },
  { inputDir: 'coverage/component', outputFile: 'component-coverage.html', title: 'Component Coverage' },
  { inputDir: 'coverage/merged', outputFile: 'merged-coverage.html', title: 'Merged Coverage' },
]

const bundled: { file: string; title: string }[] = []

for (const report of coverageReports) {
  const inputPath = path.join(process.cwd(), report.inputDir)
  if (!fs.existsSync(path.join(inputPath, 'index.html'))) {
    console.log(`[BundleReports] ${report.title}: not found`)
    continue
  }

  try {
    const result = bundleCoverage({ inputDir: inputPath, title: report.title })
    fs.writeFileSync(path.join(reportDir, report.outputFile), result.html)
    console.log(`[BundleReports] ${report.title}: ${result.fileCount} files, ${Math.round(result.totalSize / 1024)}KB`)
    bundled.push({ file: report.outputFile, title: report.title })
  } catch (error) {
    console.error(`[BundleReports] ${report.title} failed:`, error)
  }
}

// Add links to Playwright report
if (bundled.length > 0) {
  const indexPath = path.join(reportDir, 'index.html')
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf-8')

    // Build buttons for new reports
    const newButtons = bundled
      .filter((r) => !html.includes(r.file))
      .map(
        (r) =>
          `<a href="${r.file}" target="_blank" style="background:#22c55e;color:white;padding:6px 12px;border-radius:6px;text-decoration:none;font-weight:500;font-size:13px;box-shadow:0 2px 4px rgba(0,0,0,0.2);margin-left:8px;">${r.title}</a>`
      )
      .join('')

    if (newButtons && html.includes('coverage-reporter-links')) {
      // Insert before the closing </div> of the coverage-reporter-links container
      html = html.replace(/(id="coverage-reporter-links"[^>]*>)/, '$1' + newButtons)
      fs.writeFileSync(indexPath, html)
      console.log(`[BundleReports] Injected ${bundled.length} coverage links`)
    }
  }
}

console.log(`[BundleReports] Done. Bundled ${bundled.length} reports.`)
