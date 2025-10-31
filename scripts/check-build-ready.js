/**
 * Pre-Build Checklist
 * Verifies all prerequisites are in place before building executable
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════');
console.log('  Build Prerequisites Check');
console.log('═══════════════════════════════════════════════════\n');

let allGood = true;

// Check 1: Node modules
console.log('[1/7] Checking dependencies...');
const nodeModules = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModules)) {
  console.log('✓ Dependencies installed\n');
} else {
  console.log('✗ Dependencies missing. Run: npm install\n');
  allGood = false;
}

// Check 2: Client dependencies
console.log('[2/7] Checking client dependencies...');
const clientModules = path.join(process.cwd(), 'src', 'client', 'node_modules');
if (fs.existsSync(clientModules)) {
  console.log('✓ Client dependencies installed\n');
} else {
  console.log('✗ Client dependencies missing. Run: cd src/client && npm install\n');
  allGood = false;
}

// Check 3: TypeScript build
console.log('[3/7] Checking server build...');
const serverBuild = path.join(process.cwd(), 'dist', 'server', 'server', 'index.js');
if (fs.existsSync(serverBuild)) {
  console.log('✓ Server build exists\n');
} else {
  console.log('⚠ Server not built yet. Will build automatically.\n');
}

// Check 4: Client build
console.log('[4/7] Checking client build...');
const clientBuild = path.join(process.cwd(), 'src', 'client', 'dist', 'index.html');
if (fs.existsSync(clientBuild)) {
  console.log('✓ Client build exists\n');
} else {
  console.log('⚠ Client not built yet. Will build automatically.\n');
}

// Check 5: Neutralino binaries
console.log('[5/7] Checking Neutralino binaries...');
const neutralinoBin = path.join(process.cwd(), 'bin', 'neutralino-win_x64.exe');
if (fs.existsSync(neutralinoBin)) {
  const stats = fs.statSync(neutralinoBin);
  console.log(`✓ Neutralino binary found (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n`);
} else {
  console.log('✗ Neutralino binary missing. Run: npx @neutralinojs/neu update\n');
  allGood = false;
}

// Check 6: pkg installed
console.log('[6/7] Checking pkg...');
try {
  const pkgPath = require.resolve('pkg');
  console.log('✓ pkg installed\n');
} catch (e) {
  console.log('✗ pkg not found. Run: npm install\n');
  allGood = false;
}

// Check 7: Neutralino config
console.log('[7/7] Checking Neutralino config...');
const neutralinoConfig = path.join(process.cwd(), 'neutralino.config.json');
if (fs.existsSync(neutralinoConfig)) {
  const config = JSON.parse(fs.readFileSync(neutralinoConfig, 'utf8'));
  console.log(`✓ Neutralino config found (v${config.version || 'unknown'})\n`);
} else {
  console.log('✗ neutralino.config.json missing\n');
  allGood = false;
}

// Summary
console.log('═══════════════════════════════════════════════════');
if (allGood) {
  console.log('✓ All prerequisites met! Ready to build.');
  console.log('\nTo build executable, run:');
  console.log('  npm run build:exe\n');
  process.exit(0);
} else {
  console.log('✗ Some prerequisites missing. Please fix the issues above.\n');
  
  console.log('Common fixes:');
  console.log('  npm install                          # Install dependencies');
  console.log('  cd src/client && npm install         # Install client deps');
  console.log('  npx @neutralinojs/neu update         # Download Neutralino\n');
  
  process.exit(1);
}

