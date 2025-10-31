/**
 * Task Tracker Desktop App Launcher
 * Starts the Express server, waits for it to be ready, then launches Neutralino
 */

const { spawn, execFileSync } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');

let serverProcess = null;
let neutralinoProcess = null;
let v0Process = null;
let v0PortSelected = 5000; // Next dev server target port (starting at 5000)
// Generic port checker
function checkPort(port, timeout = 3000) {
  return new Promise((resolve) => {
    const req = http.request({ hostname: '127.0.0.1', port, timeout }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { try { req.destroy(); } catch(_){}; resolve(false); });
    req.end();
  });
}

async function waitForPort(port, maxAttempts = 30, interval = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkPort(port)) return true;
    await new Promise(r => setTimeout(r, interval));
  }
  return false;
}

async function findOpenPort(start = 5000, end = 5020) {
  console.log(`[Launcher] Looking for available port starting at ${start}...`);
  for (let p = start; p <= end; p++) {
    const inUse = await checkPort(p, 500);
    if (!inUse) {
      console.log(`[Launcher] Found available port: ${p}`);
      return p;
    }
    console.log(`[Launcher] Port ${p} is in use, trying next...`);
  }
  console.log(`[Launcher] No available ports found in range ${start}-${end}, using ${start}`);
  return start;
}


// Check if server is responding
async function isServerReady() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8765/api/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000);
  });
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30) {
  console.log('[Launcher] Waiting for server to be ready...');

  for (let i = 0; i < maxAttempts; i++) {
    if (await isServerReady()) {
      console.log('[Launcher] Server is ready! ✓');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    process.stdout.write('.');
  }

  console.log('\n[Launcher] Server failed to start ✗');
  return false;
}

// Check if client (SPA) is served at root
async function isClientReady() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8765/', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000);
  });
}

// Ensure client build exists; build if missing
async function ensureClientBuilt() {
  const clientIndexPath = path.join(__dirname, 'src', 'client', 'dist', 'index.html');
  if (fs.existsSync(clientIndexPath)) {
    return true;
  }

  console.log('[Launcher] Client build not found. Building client...');
  return new Promise((resolve) => {
    const build = spawn('npm', ['run', 'build:client'], { shell: true, stdio: 'inherit' });
    build.on('close', (code) => {
      if (code === 0 && fs.existsSync(clientIndexPath)) {
        console.log('[Launcher] Client build completed ✓');
        resolve(true);
      } else {
        console.error('[Launcher] Client build failed ✗');
        resolve(false);
      }
    });
  });
}

// Ensure server is built (TypeScript -> dist)
async function ensureServerBuilt() {
  const serverEntry = path.join(__dirname, 'dist', 'server', 'server', 'index.js');
  console.log('[Launcher] Building server...');
  return new Promise((resolve) => {
    const build = spawn('npm', ['run', 'build:server'], { shell: true, stdio: 'inherit' });
    build.on('close', (code) => {
      if (code === 0 && fs.existsSync(serverEntry)) {
        console.log('[Launcher] Server build completed ✓');
        resolve(true);
      } else {
        console.error('[Launcher] Server build failed ✗');
        resolve(false);
      }
    });
  });
}

// Recursively copy directory
function copyDirectoryRecursive(sourceDir, destinationDir) {
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry.name);
    const dstPath = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// Ensure client assets are copied under resources/app for Neutralino internal server
async function ensureClientInResources() {
  const clientDist = path.join(__dirname, 'src', 'client', 'dist');
  const resourcesApp = path.join(__dirname, 'resources', 'app');

  try {
    if (!fs.existsSync(clientDist)) {
      return false;
    }

    // Clean destination to avoid stale assets
    if (fs.existsSync(resourcesApp)) {
      fs.rmSync(resourcesApp, { recursive: true, force: true });
    }

    copyDirectoryRecursive(clientDist, resourcesApp);
    console.log('[Launcher] Copied client build to resources/app ✓');
    return true;
  } catch (error) {
    console.error('[Launcher] Failed to copy client to resources:', error.message);
    return false;
  }
}

// Kill any existing instance to avoid duplicate-instance immediate exit
function killExistingInstanceIfAny() {
  try {
    console.log('[Launcher] Checking for existing instances...');
    
    // Kill existing server processes on port 8765
    try {
      if (process.platform === 'win32') {
        execFileSync('powershell', [
          '-Command',
          `$port = Get-NetTCPConnection -LocalPort 8765 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; if ($port) { Stop-Process -Id $port -Force; Write-Host "Killed server on port 8765" }`
        ], { stdio: 'inherit' });
      } else {
        execFileSync('lsof', ['-ti', ':8765'], { stdio: 'pipe' })
          .toString()
          .split('\n')
          .filter(pid => pid)
          .forEach(pid => {
            try { process.kill(parseInt(pid), 'SIGKILL'); } catch (_) {}
          });
      }
    } catch (_) {
      console.log('[Launcher] No server found on port 8765');
    }

    // Kill v0 server processes on ports 5000-5020
    try {
      if (process.platform === 'win32') {
        for (let port = 5000; port <= 5020; port++) {
          try {
            execFileSync('powershell', [
              '-Command',
              `$port = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess; if ($port) { Stop-Process -Id $port -Force -ErrorAction SilentlyContinue }`
            ], { stdio: 'pipe' });
          } catch (_) {}
        }
      }
    } catch (_) {
      console.log('[Launcher] No v0 servers found');
    }

    // Kill Neutralino processes
    try {
      if (process.platform === 'win32') {
        execFileSync('taskkill', ['/F', '/IM', 'task-tracker.exe'], { stdio: 'pipe' });
        execFileSync('taskkill', ['/F', '/IM', 'neutralino-win_x64.exe'], { stdio: 'pipe' });
      } else {
        execFileSync('pkill', ['-f', 'task-tracker'], { stdio: 'pipe' });
        execFileSync('pkill', ['-f', 'neutralino'], { stdio: 'pipe' });
      }
      console.log('[Launcher] Killed existing Neutralino processes');
    } catch (_) {
      console.log('[Launcher] No Neutralino processes found');
    }

    // Use instance management script if available
    try {
      execFileSync('node', ['scripts/check-instances.js', 'kill'], { stdio: 'inherit' });
    } catch (_) {
      // Script may not exist or no instances found
    }

    // Clean up lock files
    try {
      const lockFile = path.join(__dirname, '.app-instance.lock');
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
        console.log('[Launcher] Removed stale lock file');
      }
    } catch (_) {
      // Lock file may not exist
    }

    // Wait a moment for processes to fully terminate
    const { spawnSync } = require('child_process');
    if (process.platform === 'win32') {
      spawnSync('timeout', ['/t', '2', '/nobreak'], { stdio: 'ignore', shell: true });
    } else {
      spawnSync('sleep', ['2'], { stdio: 'ignore' });
    }

    console.log('[Launcher] Cleanup complete ✓');
  } catch (error) {
    console.warn('[Launcher] Cleanup warning:', error.message);
    // Continue anyway - we'll handle port conflicts later
  }
}

// Start the Express server
async function startServer() {
  console.log('[Launcher] Starting Express server...');

  // Detect best database file to use (prefer existing populated/updated one)
  const dbCandidates = [
    path.join(process.cwd(), 'database', 'task_tracker.db'),
    path.join(process.cwd(), 'local_task_tracker.db'),
  ];

  function getCandidateScore(filePath) {
    try {
      if (!fs.existsSync(filePath)) return -1;
      const stat = fs.statSync(filePath);
      // Heuristic score: larger size and newer mtime preferred
      return stat.size + stat.mtimeMs;
    } catch (_) {
      return -1;
    }
  }

  function countTasks(filePath) {
    return new Promise((resolve) => {
      if (!fs.existsSync(filePath)) return resolve(-1);
      const db = new sqlite3.Database(filePath, (err) => {
        if (err) return resolve(-1);
        db.get("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='tasks'", (e1, meta) => {
          if (e1 || !meta || meta.count === 0) {
            db.close();
            return resolve(0);
          }
          db.get('SELECT COUNT(*) as count FROM tasks', (e2, row) => {
            const c = e2 ? 0 : (row?.count || 0);
            db.close();
            resolve(c);
          });
        });
      });
    });
  }

  let selectedDb = null;
  let bestScore = -1;
  // Try to pick by task count first
  try {
    const counts = await Promise.all(dbCandidates.map((c) => countTasks(c)));
    const maxCount = Math.max(...counts);
    if (maxCount > 0) {
      const idx = counts.indexOf(maxCount);
      selectedDb = dbCandidates[idx];
    }
  } catch (_) {}
  // Fallback to size/mtime heuristic
  if (!selectedDb) {
    for (const candidate of dbCandidates) {
      const score = getCandidateScore(candidate);
      if (score > bestScore) {
        bestScore = score;
        selectedDb = candidate;
      }
    }
  }

  if (selectedDb) {
    console.log(`[Launcher] Using database file: ${selectedDb}`);
  } else {
    // Default to database/task_tracker.db path
    selectedDb = path.join(process.cwd(), 'database', 'task_tracker.db');
    console.log(`[Launcher] No existing DB found. Will create at: ${selectedDb}`);
  }

  serverProcess = spawn('node', [
    '--expose-gc',
    '--max_old_space_size=80',
    '--max_semi_space_size=8',
    '--optimize_for_size',
    'dist/server/server/index.js'
  ], {
    env: { ...process.env, PORT: '8765', DB_PATH: selectedDb, V0_PORT: String(v0PortSelected) },
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data.toString().trim()}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`[Launcher] Server exited with code ${code}`);
  });
}

// Start Neutralino
function startNeutrino() {
  console.log('[Launcher] Starting Neutralino desktop app...\n');

  // Use official Neutralino CLI to run the app from project root (loads neutralino.config.json)
  neutralinoProcess = spawn('npx', ['--yes', '@neutralinojs/neu', 'run'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  neutralinoProcess.on('close', (code) => {
    console.log('\n[Launcher] App closed. Cleaning up...');
    cleanup();
  });
}

// Cleanup on exit
function cleanup() {
  if (serverProcess) {
    console.log('[Launcher] Stopping server...');
    serverProcess.kill();
  }
  if (v0Process) {
    console.log('[Launcher] Stopping v0 UI server...');
    v0Process.kill();
  }
  process.exit(0);
}

// Main launcher
async function launch() {
  console.log('═══════════════════════════════════════');
  console.log('  Task Tracker - Desktop App Launcher  ');
  console.log('═══════════════════════════════════════\n');

  // Proactively terminate any existing instance first
  killExistingInstanceIfAny();

  // Make sure client assets are available
  const clientReadyOrBuilt = await ensureClientBuilt();
  if (!clientReadyOrBuilt) {
    console.error('[Launcher] Cannot proceed without client build');
    return cleanup();
  }

  // Ensure Neutralino can serve the built UI from /resources/app
  await ensureClientInResources();

  // Ensure server is built
  const serverBuilt = await ensureServerBuilt();
  if (!serverBuilt) {
    console.error('[Launcher] Cannot proceed without server build');
    return cleanup();
  }

  // Pick v0 port first so server can advertise it (starting at 5000)
  v0PortSelected = await findOpenPort(5000, 5020);

  // Start server
  await startServer();

  // Wait for server to be ready
  if (!(await waitForServer())) {
    console.error('[Launcher] Failed to start. Check the logs.');
    cleanup();
    return;
  }

  // Verify client is served before launching the desktop shell (best effort)
  for (let i = 0; i < 10; i++) {
    if (await isClientReady()) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  // Prepare v0 UI: run Next dev server on selected port
  const v0Ready = await ensureV0UiReady();
  if (!v0Ready) {
    console.error('[Launcher] v0 UI failed to start on port ' + v0PortSelected + '. Check logs.');
  }

  // Launch Neutralino
  startNeutrino();
}

// =============== v0 Next.js UI Support ===============
async function ensureV0UiReady() {
  try {
    const okDeps = await ensureV0Dependencies();
    if (!okDeps) return false;
    await startV0Server('dev', v0PortSelected);
    return await waitForPort(v0PortSelected, 60, 500);
  } catch (e) {
    console.error('[Launcher] v0 UI error:', e.message || e);
    return false;
  }
}

function ensureV0Dependencies() {
  return new Promise((resolve) => {
    const cwd = path.join(process.cwd(), 'v0-task-manager-ui');
    const nodeModules = path.join(cwd, 'node_modules');
    if (fs.existsSync(nodeModules)) {
      return resolve(true);
    }
    console.log('[Launcher] Installing v0 UI dependencies...');
    const install = spawn('npm', ['install', '--silent', '--no-audit', '--legacy-peer-deps'], { shell: true, stdio: 'inherit', cwd });
    install.on('close', (code) => resolve(code === 0));
  });
}

function ensureV0Built() {
  return new Promise((resolve) => {
    const cwd = path.join(process.cwd(), 'v0-task-manager-ui');
    const outIndex = path.join(cwd, 'out', 'index.html');
    if (fs.existsSync(outIndex)) {
      return resolve(true);
    }
    console.log('[Launcher] Building v0 UI (export)...');
    const build = spawn('npx', ['--yes', 'next', 'build'], { shell: true, stdio: 'inherit', cwd });
    build.on('close', (code) => {
      const exists = fs.existsSync(outIndex);
      resolve(code === 0 && exists);
    });
  });
}

async function startV0Server(mode, port) {
  const cwd = path.join(process.cwd(), 'v0-task-manager-ui');
  if (v0Process) {
    try { v0Process.kill(); } catch (_) {}
    v0Process = null;
  }
  const standaloneServer = path.join(cwd, '.next', 'standalone', 'server.js');
  if (mode !== 'dev' && fs.existsSync(standaloneServer)) {
    // Ensure required asset folders exist beside standalone server
    try {
      const standaloneRoot = path.join(cwd, '.next', 'standalone');
      const staticSrc = path.join(cwd, '.next', 'static');
      const staticDst = path.join(standaloneRoot, '.next', 'static');
      const publicSrc = path.join(cwd, 'public');
      const publicDst = path.join(standaloneRoot, 'public');

      if (fs.existsSync(staticSrc)) {
        copyDirectoryRecursive(staticSrc, staticDst);
      }
      if (fs.existsSync(publicSrc)) {
        copyDirectoryRecursive(publicSrc, publicDst);
      }

      console.log(`[Launcher] Starting v0 standalone server on http://localhost:${port} ...`);
      v0Process = spawn(process.execPath, ['server.js'], {
        shell: false,
        stdio: 'pipe',
        cwd: standaloneRoot,
        env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NEXT_TELEMETRY_DISABLED: '1' }
      });
    } catch (e) {
      console.warn('[Launcher] Failed to start standalone v0 server:', e.message);
    }
  }

  // Fallback to npm run (start/dev)
  if (!v0Process) {
    const script = mode === 'dev' ? 'dev' : 'start';
    console.log(`[Launcher] Starting v0 UI (${script}) on http://localhost:${port} ...`);
    v0Process = spawn('npm', ['run', script, '--', '-p', String(port), '-H', '127.0.0.1'], {
      shell: true,
      stdio: 'pipe',
      cwd,
      env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', NEXT_TELEMETRY_DISABLED: '1' },
      argv0: undefined
    });
  }

  // Try to pass explicit flags to Next start via stdin fallback if script ignores PORT
  // Prefer using arguments directly when script supports it
  // no-op

  v0Process.stdout.on('data', (data) => {
    process.stdout.write(`[v0] ${data.toString()}`);
  });
  v0Process.stderr.on('data', (data) => {
    process.stderr.write(`[v0] ${data.toString()}`);
  });
  v0Process.on('close', (code) => {
    console.log(`[Launcher] v0 UI server exited with code ${code}`);
  });
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Run the launcher
launch().catch((err) => {
  console.error('[Launcher] Fatal error:', err);
  cleanup();
});
