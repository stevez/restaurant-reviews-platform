/**
 * Custom Playwright Reporter that adds E2E coverage as a global attachment
 * to the standard HTML report.
 *
 * This reporter wraps the built-in HTML reporter and injects the coverage
 * report after all tests complete.
 */
import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter'
import { bundleCoverage } from 'coverage-single-html'
import * as fs from 'fs'
import * as path from 'path'

class CoverageReporter implements Reporter {
  private outputDir: string

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir || 'playwright-report'
  }

  onBegin(config: FullConfig, suite: Suite) {
    // Nothing to do on begin
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Nothing to do per test
  }

  async onEnd(result: FullResult) {
    // Wait a bit for the HTML report to be generated
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const coverageDir = path.join(process.cwd(), 'coverage', 'e2e')
    const coverageIndex = path.join(coverageDir, 'index.html')

    if (!fs.existsSync(coverageIndex)) {
      console.log('[CoverageReporter] No E2E coverage report found')
      return
    }

    try {
      const bundled = bundleCoverage({
        inputDir: coverageDir,
        title: 'E2E Coverage Report',
      })

      // Write the bundled coverage to the playwright report directory
      const reportDir = path.join(process.cwd(), this.outputDir)
      const coverageOutputPath = path.join(reportDir, 'e2e-coverage.html')

      if (fs.existsSync(reportDir)) {
        fs.writeFileSync(coverageOutputPath, bundled.html)
        console.log(`[CoverageReporter] E2E coverage report saved to ${coverageOutputPath}`)
        console.log(`[CoverageReporter] ${bundled.fileCount} files, ${Math.round(bundled.totalSize / 1024)}KB`)

        // Inject link into the main report index.html
        await this.injectCoverageLink(reportDir)
      }
    } catch (error) {
      console.error('[CoverageReporter] Failed to bundle coverage:', error)
    }
  }

  private async injectCoverageLink(reportDir: string) {
    const indexPath = path.join(reportDir, 'index.html')

    if (!fs.existsSync(indexPath)) {
      return
    }

    let html = fs.readFileSync(indexPath, 'utf-8')

    // Check if already injected
    if (html.includes('e2e-coverage.html')) {
      return
    }

    // Inject a link to the coverage report in the header area
    const linkHtml = `
    <div style="position: fixed; top: 10px; right: 10px; z-index: 9999;">
      <a href="e2e-coverage.html" target="_blank"
         style="background: #22c55e; color: white; padding: 8px 16px;
                border-radius: 6px; text-decoration: none; font-weight: 500;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        View E2E Coverage
      </a>
    </div>`

    // Inject after <body> tag
    html = html.replace(/<body[^>]*>/, (match) => match + linkHtml)

    fs.writeFileSync(indexPath, html)
    console.log('[CoverageReporter] Injected coverage link into HTML report')
  }
}

export default CoverageReporter
