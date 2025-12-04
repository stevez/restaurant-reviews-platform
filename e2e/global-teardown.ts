import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { CDPClient } from 'monocart-coverage-reports'
import { addCoverageReport } from 'monocart-reporter'
import type { FullConfig } from '@playwright/test'

// Server-side coverage configuration
const coverageConfig = {
  // CDP inspector port (from CDP_PORT env var, must match NODE_OPTIONS=--inspect=PORT in start:e2e script)
  cdpPort: parseInt(process.env.CDP_PORT || '9230', 10),
  // Directory where V8 coverage data is written
  v8CoverageDir: '.v8-coverage',
  // Include URLs matching these patterns (server-side bundles with source maps)
  includeUrlPatterns: [
    '.next/server/app',
    '.next/server/chunks',
    '.next/server/src',
  ],
  // Exclude URLs matching these patterns
  excludeUrlPatterns: ['node_modules'],
  // Source path prefix to normalize (for source map paths)
  sourcePathPrefix: 'src/',
}

interface V8CoverageEntry {
  scriptId: string
  url: string
  functions: unknown[]
  source?: string
  sourceMap?: unknown
}

export default async function globalTeardown(config: FullConfig) {
  console.log('\n✅ E2E tests complete')

  // Connect to the Node.js inspector to collect server-side coverage
  console.log('📊 Collecting server-side coverage via CDP...')

  let client: Awaited<ReturnType<typeof CDPClient>> | undefined

  try {
    const { cdpPort, v8CoverageDir, includeUrlPatterns, excludeUrlPatterns, sourcePathPrefix } = coverageConfig

    client = await CDPClient({
      port: cdpPort,
    })

    if (!client) {
      console.log('⚠️ Could not connect to CDP client')
      return
    }

    // Write coverage data from the inspector to .v8-coverage directory
    await client.writeCoverage()

    const coverageDir = path.join(process.cwd(), v8CoverageDir)

    // Read and process coverage files from the directory
    if (fs.existsSync(coverageDir)) {
      const files = fs.readdirSync(coverageDir).filter((f) => f.endsWith('.json'))

      for (const file of files) {
        const filePath = path.join(coverageDir, file)
        const content = fs.readFileSync(filePath, 'utf-8')
        const json = JSON.parse(content)

        if (json.result && Array.isArray(json.result)) {
          // Filter to file:// URLs for server-side code
          let coverageList: V8CoverageEntry[] = json.result.filter((entry: V8CoverageEntry) => {
            const url = entry.url || ''
            if (!url.startsWith('file://')) return false
            // Exclude URLs matching exclude patterns
            if (excludeUrlPatterns.some((pattern) => url.includes(pattern))) return false
            // Include URLs matching include patterns
            return includeUrlPatterns.some((pattern) => url.includes(pattern))
          })

          // Append source code to each entry (required for monocart)
          for (const entry of coverageList) {
            if (entry.url) {
              try {
                const sourcePath = fileURLToPath(entry.url)
                if (fs.existsSync(sourcePath)) {
                  entry.source = fs.readFileSync(sourcePath, 'utf-8')
                  // Check for source map
                  const mapPath = sourcePath + '.map'
                  if (fs.existsSync(mapPath)) {
                    const sourceMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'))
                    // Normalize source paths in the source map to match monocart's expected format
                    // Convert absolute Windows paths like C:\...\src\file.ts to src/file.ts
                    if (sourceMap.sources && Array.isArray(sourceMap.sources)) {
                      const prefixPattern = new RegExp(`[/\\\\]${sourcePathPrefix.replace('/', '')}[/\\\\](.+)$`)
                      sourceMap.sources = sourceMap.sources.map((src: string) => {
                        const match = src.match(prefixPattern)
                        if (match) {
                          return sourcePathPrefix + match[1].replace(/\\/g, '/')
                        }
                        return src
                      })
                    }
                    entry.sourceMap = sourceMap
                  }
                }
              } catch {
                // Skip entries we can't process
              }
            }
          }

          // Filter to entries that have source code
          coverageList = coverageList.filter((entry) => entry.source)

          if (coverageList.length > 0) {
            console.log(`  Found ${coverageList.length} server-side coverage entries`)
            // Use addCoverageReport from monocart-reporter to add to the global coverage
            // There is no test info on teardown, just mock one with required config
            const mockTestInfo = { config } as Parameters<typeof addCoverageReport>[1]
            await addCoverageReport(coverageList, mockTestInfo)
          }
        }
      }
    }

    console.log('✅ Server-side coverage collected')
  } catch (error) {
    console.log('⚠️ Could not collect server-side coverage:', (error as Error).message)
  } finally {
    if (client) {
      await client.close()
    }
  }

  // Teardown is handled by the separate teardown-db.ts script
}
