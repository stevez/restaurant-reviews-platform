/**
 * Debug script to test coverage processing step by step
 */

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const projectRoot = 'C:/Users/huiga.DESKTOP-0IUELD6/development/Steve-zhang'

// Read the V8 coverage file
const coverageFile = './.v8-coverage/coverage-89452-1764996516684-0.json'
const data = JSON.parse(readFileSync(coverageFile, 'utf-8'))

console.log('=== V8 Coverage Analysis ===\n')
console.log('Total coverage entries:', data.result.length)
console.log('Has source-map-cache:', !!data['source-map-cache'])

// Find Next.js entries
const nextEntries = data.result.filter(e => e.url.includes('.next/server/'))
console.log('Next.js server entries:', nextEntries.length)

// Analyze the page.js entry
const pageUrl = 'file:///C:/Users/huiga.DESKTOP-0IUELD6/development/Steve-zhang/.next/server/app/page.js'
const pageEntry = data.result.find(e => e.url === pageUrl)
const pageSourceMap = data['source-map-cache'][pageUrl]

if (!pageEntry) {
  console.log('\n❌ No page.js entry found')
  process.exit(1)
}

console.log('\n=== Analyzing page.js ===')
console.log('URL:', pageUrl)
console.log('Functions count:', pageEntry.functions.length)

if (!pageSourceMap) {
  console.log('❌ No source map cached for page.js')
  process.exit(1)
}

console.log('\n=== Source Map Analysis ===')
console.log('Sources count:', pageSourceMap.data.sources.length)
console.log('Has sourcesContent:', !!pageSourceMap.data.sourcesContent)

// Simulate cleanSourceMap logic
console.log('\n=== Testing cleanSourceMap Logic ===')

const sourceMap = pageSourceMap.data
const filePath = pageUrl.replace('file:///', '')
const directory = dirname(filePath)

let validCount = 0
let skippedReasons = {}

function addSkipReason(reason) {
  skippedReasons[reason] = (skippedReasons[reason] || 0) + 1
}

// Simple source filter - matches default options
function sourceFilter(path) {
  const normalizedPath = path.replace(/\\/g, '/')

  // Exclude test files
  const excludePatterns = [
    'src/**/__tests__/**',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}',
    'src/**/test/**',
    'node_modules/**',
  ]

  for (const pattern of excludePatterns) {
    const regexPattern = pattern
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/{{GLOBSTAR}}/g, '.*')
      .replace(/\//g, '\\/')

    const regex = new RegExp(regexPattern)
    if (regex.test(normalizedPath)) {
      return false
    }
  }

  // Include src files
  const includePatterns = ['src/**/*.{ts,tsx,js,jsx}']
  for (const pattern of includePatterns) {
    const regexPattern = pattern
      .replace(/\{[^}]+\}/g, '[^/]+')
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/{{GLOBSTAR}}/g, '.*')
      .replace(/\//g, '\\/')

    const regex = new RegExp(regexPattern)
    if (regex.test(normalizedPath)) {
      return true
    }
  }

  return false
}

for (let i = 0; i < sourceMap.sources.length; i++) {
  const source = sourceMap.sources[i]
  const content = sourceMap.sourcesContent?.[i]

  console.log(`\nSource ${i}: ${source?.substring(0, 100)}...`)

  // Check if source is problematic
  if (!source || source.trim() === '') {
    console.log('  ⏭️  Skipped: Empty source')
    addSkipReason('empty')
    continue
  }

  // Check for webpack externals
  if (source.startsWith('external ') || source.includes('external%20commonjs') || source.includes('external%20commonjs2')) {
    console.log('  ⏭️  Skipped: Webpack external')
    addSkipReason('webpack-external')
    continue
  }

  // Skip webpack internal queries
  if (source.startsWith('webpack://') && source.includes('?')) {
    console.log('  ⏭️  Skipped: Webpack query')
    addSkipReason('webpack-query')
    continue
  }

  // Resolve the source path
  let resolvedPath
  if (source.startsWith('file://')) {
    resolvedPath = decodeURIComponent(source.replace(/^file:\/\/\//, '').replace(/^file:\/\//, ''))
  } else if (/^[A-Z]:[/\\]/.test(source)) {
    resolvedPath = source
  } else if (source.startsWith('webpack://')) {
    const match = source.match(/webpack:\/\/[^/]+\/\.\/(.*)$/)
    if (match) {
      resolvedPath = resolve(projectRoot, match[1])
    } else {
      console.log('  ⏭️  Skipped: Webpack URL without path')
      addSkipReason('webpack-no-path')
      continue
    }
  } else {
    resolvedPath = resolve(directory, source)
  }

  console.log(`  Resolved to: ${resolvedPath}`)

  // Skip paths in .next directory
  if (resolvedPath.includes('.next/') || resolvedPath.includes('.next\\')) {
    console.log('  ⏭️  Skipped: .next directory')
    addSkipReason('.next-dir')
    continue
  }

  // Skip paths not in project
  if (/^[A-Z]:[/\\]/.test(resolvedPath)) {
    const normalizedPath = resolvedPath.replace(/\\/g, '/')
    const normalizedRoot = projectRoot.replace(/\\/g, '/')
    if (!normalizedPath.startsWith(normalizedRoot)) {
      console.log('  ⏭️  Skipped: Outside project')
      addSkipReason('outside-project')
      continue
    }
  }

  // Check for node_modules
  if (resolvedPath.includes('node_modules')) {
    console.log('  ⏭️  Skipped: node_modules')
    addSkipReason('node_modules')
    continue
  }

  // Apply source filter
  if (!sourceFilter(resolvedPath)) {
    console.log('  ⏭️  Skipped: Failed source filter')
    addSkipReason('source-filter')
    continue
  }

  // Check content
  if (!content || typeof content !== 'string') {
    console.log('  ⏭️  Skipped: No content')
    addSkipReason('no-content')
    continue
  }

  console.log('  ✅ Valid source!')
  validCount++
}

console.log('\n=== Summary ===')
console.log('Valid sources:', validCount)
console.log('Skip reasons:', skippedReasons)
