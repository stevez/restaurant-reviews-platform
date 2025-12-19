/**
 * Bundle all test and coverage reports into the Playwright report directory.
 * Runs after coverage:merge to add reports not available during E2E tests.
 */
import { bundleCoverage } from 'coverage-single-html'
import * as fs from 'fs'
import * as path from 'path'

const reportDir = path.join(process.cwd(), 'playwright-report')

if (!fs.existsSync(reportDir)) {
  console.log('[BundleReports] Playwright report directory not found')
  process.exit(0)
}

const reports = [
  { inputDir: 'coverage/unit', outputFile: 'unit-coverage.html', title: 'Unit Coverage' },
  { inputDir: 'coverage/component', outputFile: 'component-coverage.html', title: 'Component Coverage' },
  { inputDir: 'coverage/merged', outputFile: 'merged-coverage.html', title: 'Merged Coverage' },
  { inputDir: 'test-reports/unit', outputFile: 'unit-tests.html', title: 'Unit Tests' },
  { inputDir: 'test-reports/component', outputFile: 'component-tests.html', title: 'Component Tests' },
]

const bundled: string[] = []

for (const report of reports) {
  const inputPath = path.join(process.cwd(), report.inputDir)
  if (!fs.existsSync(path.join(inputPath, 'index.html'))) {
    console.log(`[BundleReports] ${report.title}: not found`)
    continue
  }

  try {
    const result = bundleCoverage({ inputDir: inputPath, title: report.title })
    fs.writeFileSync(path.join(reportDir, report.outputFile), result.html)
    console.log(`[BundleReports] ${report.title}: ${result.fileCount} files, ${Math.round(result.totalSize / 1024)}KB`)
    bundled.push(report.outputFile)
  } catch (error) {
    console.error(`[BundleReports] ${report.title} failed:`, error)
  }
}

// Add links to Playwright report
if (bundled.length > 0) {
  const indexPath = path.join(reportDir, 'index.html')
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf-8')

    for (const file of bundled) {
      if (!html.includes(file)) {
        const name = file.replace('.html', '').replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())
        const isTest = file.includes('tests')
        const color = isTest ? '#3b82f6' : '#22c55e'
        const button = `<a href="${file}" target="_blank" style="background:${color};color:white;padding:6px 12px;border-radius:6px;text-decoration:none;font-weight:500;font-size:13px;box-shadow:0 2px 4px rgba(0,0,0,0.2);margin-left:8px;">${name}</a>`

        if (html.includes('coverage-reporter-links')) {
          html = html.replace('</div>\n    </div>', button + '</div>')
          if (!html.includes(file)) {
            html = html.replace(/(id="coverage-reporter-links"[^>]*>)/, '$1' + button)
          }
        }
      }
    }

    fs.writeFileSync(indexPath, html)
  }
}

console.log(`[BundleReports] Done. Bundled ${bundled.length} reports.`)
