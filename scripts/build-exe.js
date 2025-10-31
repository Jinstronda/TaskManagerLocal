/**
 * Build Standalone Executable Distribution
 * Creates a portable .exe that can run without Node.js installation
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DIST_DIR = path.join(process.cwd(), 'dist-exe');
const RESOURCES_DIR = path.join(DIST_DIR, 'resources');
const DATABASE_DIR = path.join(DIST_DIR, 'database');

console.log('═══════════════════════════════════════════════════');
console.log('  Task Tracker - Standalone Executable Builder');
console.log('═══════════════════════════════════════════════════\n');

// Step 1: Clean previous build
function cleanPreviousBuild() {
  console.log('[1/6] Cleaning previous build...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
  fs.mkdirSync(RESOURCES_DIR, { recursive: true });
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
  console.log('✓ Clean complete\n');
}

// Step 2: Build server and client
function buildApp() {
  console.log('[2/6] Building server and client...');
  return new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build'], { shell: true, stdio: 'inherit' });
    build.on('close', (code) => {
      if (code === 0) {
        console.log('✓ Build complete\n');
        resolve();
      } else {
        reject(new Error('Build failed'));
      }
    });
  });
}

// Step 3: Package server with pkg (this becomes TaskTracker.exe)
function packageServer() {
  console.log('[3/5] Packaging server with pkg...');
  return new Promise((resolve, reject) => {
    // Package server directly as TaskTracker.exe
    const pkg = spawn('npx', [
      'pkg',
      'dist/server/server/index.js',
      '--targets', 'node18-win-x64',
      '--output', path.join(DIST_DIR, 'TaskTracker.exe'),
      '--options', 'max_old_space_size=80',
      '--compress', 'GZip'
    ], { 
      shell: true, 
      stdio: 'inherit'
    });
    
    pkg.on('close', (code) => {
      if (code === 0) {
        console.log('✓ TaskTracker.exe packaged\n');
        resolve();
      } else {
        reject(new Error('Server packaging failed'));
      }
    });
  });
}

// Step 4: Copy client build to resources
function copyClientResources() {
  console.log('[4/5] Copying client resources...');
  
  const clientDist = path.join(process.cwd(), 'src', 'client', 'dist');
  const resourcesApp = path.join(RESOURCES_DIR, 'app');
  
  if (!fs.existsSync(clientDist)) {
    throw new Error('Client build not found. Run npm run build:client first.');
  }
  
  copyDirectoryRecursive(clientDist, resourcesApp);
  
  // Copy Neutralino resources
  const neutralinoResources = path.join(process.cwd(), 'resources');
  if (fs.existsSync(neutralinoResources)) {
    const icons = path.join(neutralinoResources, 'icons');
    const js = path.join(neutralinoResources, 'js');
    
    if (fs.existsSync(icons)) {
      copyDirectoryRecursive(icons, path.join(RESOURCES_DIR, 'icons'));
    }
    if (fs.existsSync(js)) {
      copyDirectoryRecursive(js, path.join(RESOURCES_DIR, 'js'));
    }
  }
  
  console.log('✓ Client resources copied\n');
}

// Step 5: Copy Neutralino binary and build resources
function copyNeutralinoBinary() {
  console.log('[5/6] Copying Neutralino binary...');
  
  const neutralinoBin = path.join(process.cwd(), 'bin', 'neutralino-win_x64.exe');
  const destBin = path.join(DIST_DIR, 'task-tracker.exe');
  
  if (!fs.existsSync(neutralinoBin)) {
    throw new Error('Neutralino binary not found. Run: npx @neutralinojs/neu update');
  }
  
  fs.copyFileSync(neutralinoBin, destBin);
  
  // Copy neutralino config
  const config = path.join(process.cwd(), 'neutralino.config.json');
  if (fs.existsSync(config)) {
    const configContent = JSON.parse(fs.readFileSync(config, 'utf8'));
    // Update URL to point to server
    configContent.url = 'http://localhost:8765/';
    fs.writeFileSync(
      path.join(DIST_DIR, 'neutralino.config.json'),
      JSON.stringify(configContent, null, 2)
    );
  }
  
  console.log('✓ Neutralino binary copied\n');
}

// Step 6: Finalize distribution
function finalizeDistribution() {
  console.log('[6/6] Finalizing distribution...');
  createReadme();
  console.log('✓ Distribution ready\n');
}

// Create README
function createReadme() {
  const readme = `Task Tracker
=============

Minimalist task manager.

Quick Start:
Double-click TaskTracker.exe

What happens:
- TaskTracker.exe starts the server (backend + database)
- Server auto-launches task-tracker.exe (UI window)
- Your data is stored in database/task_tracker.db

That's it.
`;

  fs.writeFileSync(path.join(DIST_DIR, 'README.txt'), readme);
  
  // Create logs folder
  const logsDir = path.join(DIST_DIR, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
}

// Helper: Recursive directory copy
function copyDirectoryRecursive(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const dstPath = path.join(destination, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// Main build process
async function build() {
  try {
    cleanPreviousBuild();
    await buildApp();
    await packageServer();
    copyClientResources();
    copyNeutralinoBinary();
    finalizeDistribution();
    
    console.log('═══════════════════════════════════════════════════');
    console.log('✓ Build Complete!');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`Distribution: ${DIST_DIR}\n`);
    console.log('Files created:');
    console.log('  TaskTracker.exe      (main - double-click this)');
    console.log('  task-tracker.exe     (UI window - auto-launched)');
    console.log('  resources/           (UI assets)');
    console.log('  database/            (created on first run)\n');
    console.log('To distribute: Zip the dist-exe folder\n');
    
  } catch (error) {
    console.error('\n✗ Build failed:', error.message);
    process.exit(1);
  }
}

build();

