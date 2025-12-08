/**
 * Debug script to test client-side coverage conversion
 * Run with: node debug-client-coverage.mjs
 */

import { promises as fs } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'acorn'
import astV8ToIstanbul from 'ast-v8-to-istanbul'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  // Read a sample client coverage file
  const coverageDir = join(__dirname, '.playwright-coverage')

  try {
    const files = await fs.readdir(coverageDir)
    const coverageFiles = files.filter(f => f.startsWith('client-') && f.endsWith('.json'))

    if (coverageFiles.length === 0) {
      console.log('No client coverage files found. Run e2e tests first.')
      return
    }

    console.log(`Found ${coverageFiles.length} coverage files`)

    // Read first file
    const firstFile = coverageFiles[0]
    const content = await fs.readFile(join(coverageDir, firstFile), 'utf-8')
    const data = JSON.parse(content)

    console.log(`\nAnalyzing ${firstFile}:`)
    console.log(`  Total entries: ${data.result.length}`)

    // Look at first few entries
    for (const entry of data.result.slice(0, 5)) {
      console.log(`\n  URL: ${entry.url}`)
      console.log(`  Has source: ${!!entry.source}`)
      console.log(`  Source length: ${entry.source?.length || 0}`)
      console.log(`  Functions: ${entry.functions?.length || 0}`)

      // Try to parse and convert
      if (entry.source) {
        try {
          const ast = parse(entry.source, {
            ecmaVersion: 'latest',
            sourceType: 'module',
            allowHashBang: true,
            allowAwaitOutsideFunction: true,
            allowImportExportEverywhere: true,
            allowReserved: true,
            locations: true,
          })

          console.log(`  AST parsed successfully`)

          // Try to convert to Istanbul
          const istanbul = await astV8ToIstanbul({
            code: entry.source,
            ast,
            coverage: {
              url: entry.url,
              functions: entry.functions,
            },
            wrapperLength: 0,
            ignoreClassMethods: [],
          })

          const files = Object.keys(istanbul)
          console.log(`  Istanbul coverage files: ${files.length}`)
          files.slice(0, 3).forEach(f => console.log(`    - ${f}`))

        } catch (parseError) {
          console.log(`  Parse/convert error: ${parseError.message}`)
        }
      }
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Coverage directory not found. Run e2e tests first.')
    } else {
      throw error
    }
  }
}

main().catch(console.error)
