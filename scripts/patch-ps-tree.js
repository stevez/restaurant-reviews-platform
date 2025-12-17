#!/usr/bin/env node
/**
 * Patches ps-tree to use PowerShell instead of wmic.exe on Windows 11 24H2+
 */

const fs = require('fs')
const path = require('path')

const psTreePath = path.join(__dirname, '..', 'node_modules', 'ps-tree', 'index.js')

if (!fs.existsSync(psTreePath)) {
  console.log('ps-tree not found, skipping patch')
  process.exit(0)
}

let content = fs.readFileSync(psTreePath, 'utf8')

// Check if already patched
if (content.includes('WMIC SHIM PATCH')) {
  console.log('ps-tree already patched')
  process.exit(0)
}

// Replace wmic.exe with PowerShell command that outputs space-delimited format
// This matches the original wmic.exe output format that ps-tree expects
// First line is the header (Name, ParentProcessId, ProcessId, Status), then the data
const psCommand = "Write-Output 'Name ParentProcessId ProcessId Status'; Get-CimInstance Win32_Process | ForEach-Object { \\\"{0,-32} {1,-16} {2,-10} {3}\\\" -f $_.Name,$_.ParentProcessId,$_.ProcessId,$_.Status }";
content = content.replace(
  /spawn\('wmic\.exe',\s*\['PROCESS',\s*'GET',\s*'Name,ProcessId,ParentProcessId,Status'\]\)/,
  `spawn('powershell.exe', ['-NoProfile', '-Command', "${psCommand}"], { shell: false }) // WMIC SHIM PATCH`
)

fs.writeFileSync(psTreePath, content, 'utf8')
console.log('✅ Patched ps-tree to use PowerShell instead of wmic.exe')
