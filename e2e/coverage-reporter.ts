/**
 * Custom Playwright Reporter that bundles E2E coverage into the Playwright HTML report.
 */
import type { Reporter, FullResult } from '@playwright/test/reporter'
import * as fs from 'fs'
import * as path from 'path'

class CoverageReporter implements Reporter {
  private outputDir: string

  constructor(options: { outputDir?: string } = {}) {
    this.outputDir = options.outputDir || 'playwright-report'
  }

  async onEnd(_result: FullResult) {
    const reportDir = path.join(process.cwd(), this.outputDir)
    const indexPath = path.join(reportDir, 'index.html')

    // Wait for HTML report to be generated (max 5 seconds)
    let retries = 10
    while (!fs.existsSync(indexPath) && retries > 0) {
      await new Promise((r) => setTimeout(r, 500))
      retries--
    }

    const coverageDir = path.join(process.cwd(), 'coverage', 'e2e')

    if (!fs.existsSync(reportDir)) {
      console.log('[CoverageReporter] Report directory not found')
      return
    }

    if (!fs.existsSync(path.join(coverageDir, 'index.html'))) {
      console.log('[CoverageReporter] E2E coverage not found')
      return
    }

    try {
      // Dynamic import to avoid module loading issues
      const { bundleCoverage } = await import('coverage-single-html')

      const bundled = bundleCoverage({
        inputDir: coverageDir,
        title: 'E2E Coverage Report',
      })

      fs.writeFileSync(path.join(reportDir, 'e2e-coverage.html'), bundled.html)
      console.log(`[CoverageReporter] E2E coverage: ${bundled.fileCount} files, ${Math.round(bundled.totalSize / 1024)}KB`)

      // Inject link into Playwright report
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf-8')
        if (!html.includes('e2e-coverage.html')) {
          const linkHtml = `
    <div id="coverage-reporter-links" style="position: fixed; top: 10px; right: 10px; z-index: 9999;">
      <a href="e2e-coverage.html" target="_blank"
         style="background: #22c55e; color: white; padding: 8px 16px;
                border-radius: 6px; text-decoration: none; font-weight: 500;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
        E2E Coverage
      </a>
    </div>`
          html = html.replace(/<body[^>]*>/, (match) => match + linkHtml)
          fs.writeFileSync(indexPath, html)
          console.log('[CoverageReporter] Injected coverage link')
        }
      }
    } catch (error) {
      console.error('[CoverageReporter] Failed:', error)
    }
  }
}

export default CoverageReporter
