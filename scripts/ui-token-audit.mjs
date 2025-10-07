#!/usr/bin/env node
/*
  UI Token Audit Script
  - Scans for inline font sizes (text-[..px])
  - Scans for hardcoded colors (#hex) and inline color vars in className (bg-[...], text-[...], border-[...])
  - Reports file, line, and a short excerpt

  Usage:
    node scripts/ui-token-audit.mjs [--fix]

  Notes:
    --fix currently only suggests replacements; it does not modify files.
*/

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const TARGET_DIRS = [
  path.join(ROOT, 'app'),
  path.join(ROOT, 'components'),
]

const FILE_EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js'])

const PATTERNS = [
  { name: 'inline-font-size', regex: /text-\[[^\]]*?px\]/g, suggestion: 'Use text-xs, text-xs-sm, text-sm, text-base, text-lg, or .text-10/.text-11/.text-13' },
  { name: 'hardcoded-hex', regex: /#[0-9a-fA-F]{3,8}\b/g, suggestion: 'Use CSS variables (e.g., var(--primary), var(--text-color))' },
  { name: 'inline-color-arbitrary', regex: /(bg|text|border)-\[[^\]]+\]/g, suggestion: 'Prefer CSS variables like bg-[var(--...)]/text-[var(--...)]/border-[var(--...)]' },
]

const results = []

function scanFile(filePath) {
  let content
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch {
    return
  }
  const lines = content.split('\n')
  lines.forEach((line, idx) => {
    PATTERNS.forEach(({ name, regex, suggestion }) => {
      const matches = line.match(regex)
      if (matches) {
        results.push({ file: filePath, line: idx + 1, type: name, matches, excerpt: line.trim().slice(0, 200), suggestion })
      }
    })
  })
}

function walk(dir) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else {
      const ext = path.extname(entry.name)
      if (FILE_EXTENSIONS.has(ext)) {
        scanFile(full)
      }
    }
  }
}

for (const dir of TARGET_DIRS) {
  walk(dir)
}

if (results.length === 0) {
  console.log('✅ UI token audit passed: no inline px font sizes or hardcoded colors found in app/ and components/.')
  process.exit(0)
}

console.log(`\n❌ Found ${results.length} potential issues.\n`)
const grouped = results.reduce((acc, r) => {
  (acc[r.file] ||= []).push(r)
  return acc
}, {})

for (const [file, items] of Object.entries(grouped)) {
  console.log(`\n• ${file}`)
  for (const r of items) {
    console.log(`  - [${r.type}] line ${r.line}: ${r.matches.join(', ')}`)
    console.log(`    ${r.excerpt}`)
    console.log(`    👉 ${r.suggestion}`)
  }
}

console.log('\nℹ️ Suggestions:')
console.log('- Replace text-[12px] with text-sm, text-[13px] with text-13, etc.')
console.log('- Replace #hex and arbitrary colors with CSS variables, e.g., text-[var(--text-color)], bg-[var(--primary)].')
console.log('\nRun: npm run lint:ui')
