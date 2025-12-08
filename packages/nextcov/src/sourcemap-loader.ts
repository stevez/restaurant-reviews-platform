/**
 * Source Map Loader
 *
 * Loads source code and source maps from Next.js build output.
 * Handles the mapping between bundled code URLs and original source files.
 */

import { promises as fs } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SourceMapData, SourceFile, V8Coverage } from './types.js'
import { DEFAULT_NEXTCOV_CONFIG } from './config.js'

const FILE_PROTOCOL = 'file://'

export class SourceMapLoader {
  private projectRoot: string
  private nextBuildDir: string
  private sourceCache: Map<string, SourceFile> = new Map()

  constructor(projectRoot: string, nextBuildDir?: string) {
    this.projectRoot = projectRoot
    this.nextBuildDir = nextBuildDir || join(projectRoot, DEFAULT_NEXTCOV_CONFIG.buildDir)
  }

  /**
   * Load source code and source map for a given URL
   */
  async loadSource(url: string): Promise<SourceFile | null> {
    // Check cache first
    if (this.sourceCache.has(url)) {
      return this.sourceCache.get(url)!
    }

    try {
      const filePath = this.urlToFilePath(url)
      if (!filePath) return null

      const code = await fs.readFile(filePath, 'utf-8')
      const sourceMap = await this.loadSourceMap(filePath, code)

      const sourceFile: SourceFile = {
        path: filePath,
        code,
        sourceMap: sourceMap || undefined,
      }

      this.sourceCache.set(url, sourceFile)
      return sourceFile
    } catch (error) {
      // File doesn't exist or can't be read - silently skip
      return null
    }
  }

  /**
   * Convert URL to file path
   */
  urlToFilePath(url: string): string | null {
    // Handle file:// URLs
    if (url.startsWith(FILE_PROTOCOL)) {
      return fileURLToPath(url)
    }

    // Handle Next.js URLs like /_next/static/chunks/...
    if (url.includes('/_next/')) {
      const nextPath = url.split('/_next/')[1]
      // Decode URL-encoded characters like %5Bid%5D -> [id]
      const decodedPath = decodeURIComponent(nextPath)
      return join(this.nextBuildDir, decodedPath)
    }

    // Handle relative paths
    if (url.startsWith('/')) {
      return join(this.projectRoot, decodeURIComponent(url))
    }

    // Handle http(s) URLs - extract path
    try {
      const parsed = new URL(url)
      if (parsed.pathname.includes('/_next/')) {
        const nextPath = parsed.pathname.split('/_next/')[1]
        // Decode URL-encoded characters
        const decodedPath = decodeURIComponent(nextPath)
        return join(this.nextBuildDir, decodedPath)
      }
      return join(this.projectRoot, decodeURIComponent(parsed.pathname))
    } catch {
      return null
    }
  }

  /**
   * Load source map for a JavaScript file
   */
  async loadSourceMap(jsFilePath: string, code?: string): Promise<SourceMapData | null> {
    // Try external .map file
    const mapFilePath = jsFilePath + '.map'
    try {
      const mapContent = await fs.readFile(mapFilePath, 'utf-8')
      return JSON.parse(mapContent) as SourceMapData
    } catch {
      // External map file doesn't exist, try inline
    }

    // Try inline source map
    if (code) {
      const inlineMap = this.extractInlineSourceMap(code)
      if (inlineMap) return inlineMap
    }

    // Try sourceMappingURL comment
    if (code) {
      const urlMatch = code.match(/\/\/[#@]\s*sourceMappingURL=(.+)$/m)
      if (urlMatch) {
        const mapUrl = urlMatch[1].trim()

        // Handle data URL
        if (mapUrl.startsWith('data:')) {
          return this.parseDataUrl(mapUrl)
        }

        // Handle relative URL
        const mapPath = resolve(dirname(jsFilePath), mapUrl)
        try {
          const mapContent = await fs.readFile(mapPath, 'utf-8')
          return JSON.parse(mapContent) as SourceMapData
        } catch {
          // Map file not found
        }
      }
    }

    return null
  }

  /**
   * Extract inline base64 source map from code
   */
  extractInlineSourceMap(code: string): SourceMapData | null {
    const match = code.match(
      /\/\/[#@]\s*sourceMappingURL=data:application\/json;(?:charset=utf-8;)?base64,(.+)$/m
    )

    if (match) {
      try {
        const decoded = Buffer.from(match[1], 'base64').toString('utf-8')
        return JSON.parse(decoded) as SourceMapData
      } catch {
        return null
      }
    }

    return null
  }

  /**
   * Parse data URL source map
   */
  parseDataUrl(dataUrl: string): SourceMapData | null {
    const match = dataUrl.match(/^data:application\/json;(?:charset=utf-8;)?base64,(.+)$/)
    if (match) {
      try {
        const decoded = Buffer.from(match[1], 'base64').toString('utf-8')
        return JSON.parse(decoded) as SourceMapData
      } catch {
        return null
      }
    }
    return null
  }

  /**
   * Load source maps from V8 coverage's source-map-cache
   */
  loadFromV8Cache(coverage: V8Coverage): void {
    const cache = coverage['source-map-cache']
    if (!cache) return

    for (const [url, entry] of Object.entries(cache)) {
      if (entry.data) {
        const existing = this.sourceCache.get(url)
        if (existing) {
          existing.sourceMap = entry.data
        } else {
          this.sourceCache.set(url, {
            path: this.urlToFilePath(url) || url,
            code: '', // Code will be loaded separately
            sourceMap: entry.data,
          })
        }
      }
    }
  }

  /**
   * Resolve original source path from source map
   */
  resolveOriginalPath(sourceMap: SourceMapData, index: number): string | null {
    if (!sourceMap.sources || index >= sourceMap.sources.length) {
      return null
    }

    let sourcePath = sourceMap.sources[index]

    // Handle source root
    if (sourceMap.sourceRoot) {
      sourcePath = join(sourceMap.sourceRoot, sourcePath)
    }

    // Normalize webpack/Next.js paths
    sourcePath = this.normalizeSourcePath(sourcePath)

    return sourcePath
  }

  /**
   * Normalize source paths from source maps
   * Handles webpack:// prefixes, _N_E prefixes, etc.
   */
  normalizeSourcePath(sourcePath: string): string {
    // Remove webpack:// prefix
    if (sourcePath.startsWith('webpack://')) {
      sourcePath = sourcePath.replace(/^webpack:\/\/[^/]*\//, '')
    }

    // Remove _N_E/ prefix (Next.js internal)
    if (sourcePath.startsWith('_N_E/')) {
      sourcePath = sourcePath.slice(5)
    }

    // Remove leading ./
    if (sourcePath.startsWith('./')) {
      sourcePath = sourcePath.slice(2)
    }

    // Handle Windows absolute paths in source maps
    const srcMatch = sourcePath.match(/[/\\]src[/\\](.+)$/)
    if (srcMatch) {
      return 'src/' + srcMatch[1].replace(/\\/g, '/')
    }

    return sourcePath
  }

  /**
   * Get original source content from source map
   */
  getOriginalSource(sourceMap: SourceMapData, index: number): string | null {
    if (!sourceMap.sourcesContent || index >= sourceMap.sourcesContent.length) {
      return null
    }
    return sourceMap.sourcesContent[index]
  }

  /**
   * Clear the source cache
   */
  clearCache(): void {
    this.sourceCache.clear()
  }
}
