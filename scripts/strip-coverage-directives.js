/**
 * Strip import statements and Next.js directives from Istanbul coverage-final.json
 *
 * This normalizes coverage data before merging Unit/Component with E2E coverage,
 * since E2E (Next.js bundled) doesn't include import statements or directives.
 *
 * Strips:
 * - import statements (import ... from '...')
 * - 'use server' directives
 * - 'use client' directives
 *
 * Usage: node scripts/strip-coverage-directives.js <input> [output]
 *
 * If output is not provided, overwrites the input file.
 */

const fs = require('fs');
const path = require('path');

function stripCoverageDirectives(coverageJson) {
  let importsRemoved = 0;
  let directivesRemoved = 0;

  for (const [file, data] of Object.entries(coverageJson)) {
    // Read source file to check line content
    let lines = [];
    try {
      lines = fs.readFileSync(file, 'utf-8').split('\n');
    } catch (e) {
      // File not found, skip
      continue;
    }

    // Find statement keys to remove
    const keysToRemove = [];
    for (const [key, stmt] of Object.entries(data.statementMap || {})) {
      const lineNum = stmt.start.line;
      const lineContent = lines[lineNum - 1]?.trim() || '';

      // Check if line is an import statement
      if (lineContent.startsWith('import ') || lineContent.startsWith('import{')) {
        keysToRemove.push({ key, type: 'import' });
      }
      // Check if line is a 'use server' or 'use client' directive
      else if (lineContent === "'use server'" || lineContent === '"use server"' ||
               lineContent === "'use server';" || lineContent === '"use server";' ||
               lineContent === "'use client'" || lineContent === '"use client"' ||
               lineContent === "'use client';" || lineContent === '"use client";') {
        keysToRemove.push({ key, type: 'directive' });
      }
    }

    // Remove statements
    for (const { key, type } of keysToRemove) {
      delete data.statementMap[key];
      delete data.s[key];
      if (type === 'import') {
        importsRemoved++;
      } else {
        directivesRemoved++;
      }
    }
  }

  return { coverageJson, importsRemoved, directivesRemoved };
}

// Main
const inputPath = process.argv[2];
const outputPath = process.argv[3] || inputPath;

if (!inputPath) {
  console.log('Usage: node scripts/strip-coverage-directives.js <input.json> [output.json]');
  console.log('');
  console.log('Strips import statements and Next.js directives from coverage data.');
  console.log('Run this before merging Unit/Component coverage with E2E coverage.');
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.log(`Skipped (not found): ${inputPath}`);
  process.exit(0);
}

console.log(`Reading: ${inputPath}`);
const coverageJson = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

const { coverageJson: cleaned, importsRemoved, directivesRemoved } = stripCoverageDirectives(coverageJson);

fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2));
console.log(`Removed ${importsRemoved} import statement(s)`);
console.log(`Removed ${directivesRemoved} directive(s) ('use server'/'use client')`);
console.log(`Written: ${outputPath}`);
