/**
 * Debug script to test the coverage converter directly on V8 coverage files
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = __dirname

// Find the latest V8 coverage file
const v8Dir = join(projectRoot, '.v8-coverage')
const files = existsSync(v8Dir) ?
  readdirSync(v8Dir).filter(f => f.startsWith('coverage-') && f.endsWith('.json')) : []

if (files.length === 0) {
  console.log('No V8 coverage files found. Run e2e tests first.')
  process.exit(1)
}

const latestFile = files.sort().reverse()[0]
console.log(`Using coverage file: ${latestFile}`)

const coverage = JSON.parse(readFileSync(join(v8Dir, latestFile), 'utf-8'))

console.log(`\n=== V8 Coverage Summary ===`)
console.log(`Total entries: ${coverage.result.length}`)
console.log(`Has source-map-cache: ${!!coverage['source-map-cache']}`)
if (coverage['source-map-cache']) {
  console.log(`Source maps cached: ${Object.keys(coverage['source-map-cache']).length}`)
}

// Filter to Next.js server entries
const serverEntries = coverage.result.filter(e =>
  e.url.includes('.next/server/') &&
  !e.url.includes('node_modules')
)

console.log(`\nNext.js server entries: ${serverEntries.length}`)

// Find page.js entry
const pageEntry = coverage.result.find(e => e.url.includes('.next/server/app/page.js'))
if (pageEntry) {
  const pageUrl = pageEntry.url
  const pageSourceMap = coverage['source-map-cache']?.[pageUrl]

  console.log(`\n=== page.js Analysis ===`)
  console.log(`URL: ${pageUrl}`)
  console.log(`Functions: ${pageEntry.functions.length}`)

  if (pageSourceMap) {
    console.log(`\nSource Map:`)
    console.log(`  Sources: ${pageSourceMap.data.sources.length}`)
    console.log(`  Has sourcesContent: ${!!pageSourceMap.data.sourcesContent}`)

    // Analyze sources
    console.log(`\n  Sources analysis:`)
    pageSourceMap.data.sources.forEach((source, i) => {
      const content = pageSourceMap.data.sourcesContent?.[i]
      let type = 'unknown'

      if (!source) type = 'null'
      else if (source.includes('external%20commonjs')) type = 'webpack-external'
      else if (source.startsWith('webpack://') && source.includes('?')) type = 'webpack-query'
      else if (source.includes('/src/')) type = 'src-file'
      else if (source.includes('.next/')) type = 'next-build'

      console.log(`    ${i}: ${type} - ${source?.substring(0, 80) || '(null)'}`)
      if (type === 'src-file') {
        console.log(`       Content length: ${content?.length || 0}`)
      }
    })

    // Save page.js entry for manual testing
    const debugDir = join(projectRoot, '.coverage-debug')
    if (!existsSync(debugDir)) mkdirSync(debugDir, { recursive: true })

    const pageData = {
      entry: {
        url: pageEntry.url,
        functions: pageEntry.functions,
      },
      sourceMap: pageSourceMap,
    }

    writeFileSync(join(debugDir, 'page-entry.json'), JSON.stringify(pageData, null, 2))
    console.log(`\n✓ Saved page entry to .coverage-debug/page-entry.json`)
  }
}

// Analyze client-side entries (http URLs)
const clientEntries = coverage.result.filter(e =>
  e.url.startsWith('http://localhost:3000/_next/')
)

console.log(`\n=== Client Coverage Analysis ===`)
console.log(`Client entries: ${clientEntries.length}`)
if (clientEntries.length > 0) {
  const sample = clientEntries[0]
  console.log(`Sample: ${sample.url}`)
  console.log(`  Functions: ${sample.functions.length}`)
  console.log(`  Has source-map in cache: ${!!coverage['source-map-cache']?.[sample.url]}`)

  // Client entries won't have source maps in cache because they're http:// not file://
  console.log(`\n⚠️  Client entries don't have cached source maps.`)
  console.log(`    Source maps need to be fetched from .next/static/chunks/*.map`)
}
