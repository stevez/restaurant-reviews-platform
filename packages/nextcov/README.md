# nextcov

Collect test coverage for Playwright E2E tests in Next.js applications.

## Features

- **V8 Coverage Processing**: Read coverage from `NODE_V8_COVERAGE` directory
- **Playwright Integration**: Process client-side browser coverage
- **CDP Collection**: Collect server-side coverage via Chrome DevTools Protocol
- **Source Map Support**: Handle webpack/Next.js source maps
- **Istanbul Reports**: Generate HTML, LCOV, JSON, and text reports
- **Coverage Merging**: Merge coverage from multiple sources (unit, E2E)
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Edge Case Fixes**: Handle 0/0 branches, empty statements, module-level coverage

## Installation

```bash
npm install nextcov
```

## Quick Start

### Basic V8 Coverage Processing

```typescript
import { CoverageProcessor } from 'nextcov'

const processor = new CoverageProcessor(process.cwd(), {
  outputDir: './coverage/e2e',
  reporters: ['html', 'lcov', 'json', 'text-summary'],
})

const result = await processor.processV8Coverage()
console.log(`Lines: ${result.summary.lines.pct}%`)
```

### With Playwright

```typescript
import { CoverageProcessor } from 'nextcov'
import { test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.coverage.startJSCoverage()
})

test.afterEach(async ({ page }) => {
  const coverage = await page.coverage.stopJSCoverage()
  // Save coverage for later processing
})

// In global teardown
const processor = new CoverageProcessor(process.cwd())
const result = await processor.processAllCoverage(playwrightCoverage)
```

### Server Coverage with CDP

```typescript
import { CDPCoverageCollector } from 'nextcov/cdp'

const collector = new CDPCoverageCollector({ port: 9229 })
await collector.connect()
await collector.startCoverage()

// Run your server and tests...

const coverage = await collector.stopCoverage()
await collector.saveCoverage(coverage, './coverage/server')
```

### Merging Unit and E2E Coverage

```typescript
import { CoverageMerger } from 'nextcov/merger'

const merger = new CoverageMerger({
  strategy: 'max',  // Use max covered count for each metric
  applyFixes: true, // Fix 0/0 branches, etc.
})

const result = await merger.mergeWithBase(e2eCoverageMap, {
  baseCoveragePath: './coverage/unit/coverage-final.json',
  preferBaseStructures: true,
})

console.log(`Merged: ${result.stats.mergedFiles} files`)
```

## Configuration

### Processor Options

```typescript
interface CoverageProcessorConfig {
  projectRoot: string
  v8CoverageDir?: string        // Default: '.v8-coverage'
  nextBuildDir?: string         // Default: '.next'
  outputDir?: string            // Default: './coverage'
  sourceRoot?: string           // Default: './src'
  include?: string[]            // Default: ['src/**/*.{ts,tsx,js,jsx}']
  exclude?: string[]            // Default: ['**/__tests__/**', '**/*.test.*']
  reporters?: ReporterType[]    // Default: ['html', 'lcov', 'json', 'text-summary']
  watermarks?: Watermarks       // Coverage thresholds
  fixes?: CoverageFixConfig     // Edge case fixes
}
```

### Reporter Types

- `html` - Interactive HTML report
- `lcov` - LCOV format for CI tools
- `json` - JSON coverage data
- `text` - Console text output
- `text-summary` - Console summary only
- `cobertura` - Cobertura XML format
- `clover` - Clover XML format

### Coverage Fixes

```typescript
interface CoverageFixConfig {
  implicitBranches?: boolean      // Add 1/1 branch for files with 0/0
  coverDirectives?: boolean       // Auto-cover 'use client'/'use server'
  fixEmptyStatements?: boolean    // Re-parse files with empty statement maps
  coverModuleStatements?: boolean // Mark module-level statements as covered
}
```

## API Reference

### CoverageProcessor

Main class for processing V8 coverage.

```typescript
const processor = new CoverageProcessor(projectRoot, options?, events?)

// Process V8 coverage from directory
const result = await processor.processV8Coverage()

// Process Playwright coverage
const coverageMap = await processor.processPlaywrightCoverage(entries)

// Process both server and client coverage
const result = await processor.processAllCoverage(playwrightEntries?)

// Merge with existing coverage
const merged = await processor.mergeWithExisting(existingPath, newMap)
```

### V8CoverageReader

Read V8 coverage from various sources.

```typescript
const reader = new V8CoverageReader(options?)

// Read from NODE_V8_COVERAGE directory
const coverage = await reader.readFromDirectory(dir)

// Read from Playwright format
const coverage = reader.readFromPlaywright(entries)

// Filter to Next.js app code
const filtered = reader.filterNextJsAppCode(coverage)
```

### CDPCoverageCollector

Collect server-side coverage via Chrome DevTools Protocol.

```typescript
import { CDPCoverageCollector } from 'nextcov/cdp'

const collector = new CDPCoverageCollector({ port: 9229 })

await collector.connect()
await collector.startCoverage()
// ... run tests ...
const coverage = await collector.stopCoverage()
```

### CoverageMerger

Merge coverage from multiple sources.

```typescript
import { CoverageMerger } from 'nextcov/merger'

const merger = new CoverageMerger({ strategy: 'max' })

// Simple merge
const merged = await merger.merge(map1, map2, map3)

// Smart merge with base coverage
const result = await merger.mergeWithBase(newMap, {
  baseCoveragePath: './coverage/unit/coverage-final.json',
})
```

### PlaywrightCoverageCollector

Collect and store client-side coverage from Playwright tests.

```typescript
import { PlaywrightCoverageCollector } from 'nextcov/playwright'

const collector = new PlaywrightCoverageCollector({
  outputDir: './coverage/e2e/.cache',
})

await collector.saveCoverage('test-id', playwrightEntries)
const allCoverage = await collector.readAllCoverage()
```

## Path Utilities

Cross-platform path handling utilities.

```typescript
import {
  normalizePath,
  toPosixPath,
  toWindowsPath,
  toFileUrl,
  fromFileUrl,
  extractSourcePath,
} from 'nextcov'

// Normalize to consistent format
const path = normalizePath('C:\\Users\\...\\src\\file.ts')

// Convert between formats
const posix = toPosixPath(windowsPath)
const windows = toWindowsPath(posixPath)

// File URL conversion
const url = toFileUrl('/path/to/file.ts')
const path = fromFileUrl('file:///path/to/file.ts')
```

## Environment Variables

The library supports configuration via environment variables:

- `V8_COVERAGE_DIR` - Override v8CoverageDir
- `COVERAGE_OUTPUT_DIR` - Override outputDir
- `COVERAGE_SOURCE_ROOT` - Override sourceRoot
- `COVERAGE_REPORTERS` - Comma-separated reporter list
- `CDP_PORT` - CDP connection port
- `CDP_HOST` - CDP connection host
- `CDP_TIMEOUT` - CDP connection timeout

## Next.js Integration

### Setting up E2E Coverage

1. Start your Next.js app with coverage enabled:

```bash
NODE_V8_COVERAGE=.v8-coverage NODE_OPTIONS=--inspect=9230 next start
```

2. Configure Playwright global setup:

```typescript
// global-setup.ts
import { CDPCoverageCollector } from 'nextcov/cdp'

export default async function globalSetup() {
  const collector = new CDPCoverageCollector({ port: 9230 })
  await collector.connect()
  await collector.startCoverage()
}
```

3. Configure Playwright global teardown:

```typescript
// global-teardown.ts
import { CoverageProcessor } from 'nextcov'

export default async function globalTeardown() {
  const processor = new CoverageProcessor(process.cwd(), {
    outputDir: './coverage/e2e',
  })

  const result = await processor.processAllCoverage(clientCoverage)
  console.log(`Coverage: ${result.summary.lines.pct}%`)
}
```

## License

MIT
