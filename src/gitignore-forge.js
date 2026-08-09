#!/usr/bin/env node
/**
 * gitignore-forge / src/gitignore-forge.js
 * Detects your stack from files in the current directory and generates a
 * merged .gitignore from bundled community-style templates.
 *
 * Usage:
 *   node src/gitignore-forge.js --detect --merge
 *   node src/gitignore-forge.js node python macos
 *   node src/gitignore-forge.js --list
 */
'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATES = {
  node: `# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
dist/
build/
.env
.env.local
`,
  python: `# Python
__pycache__/
*.py[cod]
*.egg-info/
.venv/
venv/
.mypy_cache/
.pytest_cache/
dist/
build/
`,
  macos: `# macOS
.DS_Store
.AppleDouble
.LSOverride
._*
`,
  windows: `# Windows
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/
`,
  java: `# Java
*.class
*.jar
target/
.gradle/
build/
`,
  go: `# Go
*.exe
*.test
*.out
vendor/
`,
  vscode: `# VS Code
.vscode/*
!.vscode/extensions.json
`,
  jetbrains: `# JetBrains
.idea/
*.iml
`,
};

const DETECTORS = [
  { key: 'node', files: ['package.json', 'yarn.lock', 'pnpm-lock.yaml'] },
  { key: 'python', files: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'] },
  { key: 'java', files: ['pom.xml', 'build.gradle'] },
  { key: 'go', files: ['go.mod'] },
];

function detectStack(dir) {
  const found = new Set();
  const entries = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  for (const d of DETECTORS) {
    if (d.files.some((f) => entries.includes(f))) found.add(d.key);
  }
  // Always include OS + editor noise
  found.add('macos');
  found.add('windows');
  found.add('vscode');
  return [...found];
}

function mergeTemplates(keys) {
  const sections = [];
  const seen = new Set();
  keys.forEach((k) => {
    const key = k.toLowerCase();
    if (!TEMPLATES[key]) {
      console.error(`⚠ Unknown template "${key}", skipping. Known: ${Object.keys(TEMPLATES).join(', ')}`);
      return;
    }
    if (seen.has(key)) return;
    seen.add(key);
    sections.push(TEMPLATES[key]);
  });
  return sections.join('\n');
}

function printHelp() {
  console.log(`gitignore-forge — smart .gitignore generator

Usage:
  gitignore-forge --detect --merge     Detect stack in cwd, merge templates, write .gitignore
  gitignore-forge --detect             Detect stack in cwd, print result (no write)
  gitignore-forge node python macos    Merge specific named templates and write .gitignore
  gitignore-forge --list               List available templates`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printHelp();
    return;
  }

  if (args.includes('--list')) {
    console.log('Available templates:', Object.keys(TEMPLATES).join(', '));
    return;
  }

  let keys;
  if (args.includes('--detect')) {
    keys = detectStack(process.cwd());
    console.log(`Detected stack: ${keys.join(', ')}`);
  } else {
    keys = args.filter((a) => !a.startsWith('--'));
  }

  const merged = mergeTemplates(keys);

  if (args.includes('--merge') || !args.includes('--detect')) {
    const outPath = path.join(process.cwd(), '.gitignore');
    fs.writeFileSync(outPath, merged);
    console.log(`✓ Wrote ${outPath} (${keys.length} templates merged)`);
  } else {
    console.log('\n' + merged);
  }
}

main();
