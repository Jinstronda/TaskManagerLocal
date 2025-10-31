/**
 * Express Server Wrapper for Neutralinojs
 * This script starts the Express server when the Neutralino app launches
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let serverProcess = null;

// Wait for server to be ready by polling the health endpoint
async function waitForServer(maxAttempts = 30, delayMs = 500) {
  console.log('[Server Wrapper] Waiting for Express server to be ready...');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8765/api/health', (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Server responded with status ${res.statusCode}`));
          }
        });

        req.on('error', reject);
        req.setTimeout(1000);
      });

      console.log('[Server Wrapper] Express server is ready!');
      return true;
    } catch (err) {
      // Server not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.error('[Server Wrapper] Server failed to become ready within timeout');
  return false;
}

// Start the Express server
async function startServer() {
  const serverPath = path.join(__dirname, '../../dist/server/server/index.js');

  console.log('[Server Wrapper] Starting Express server...');

  serverProcess = spawn('node', [
    '--max_old_space_size=80',
    '--max_semi_space_size=8',
    '--optimize_for_size',
    '--expose-gc',
    serverPath
  ], {
    cwd: path.join(__dirname, '../..'),
    env: { ...process.env, PORT: '8765' },
    stdio: 'inherit'
  });

  serverProcess.on('close', (code) => {
    console.log(`[Server Wrapper] Express server exited with code ${code}`);
  });

  serverProcess.on('error', (err) => {
    console.error(`[Server Wrapper] Failed to start server:`, err);
  });

  // Wait for server to be ready
  await waitForServer();
}

// Stop the server
function stopServer() {
  if (serverProcess) {
    console.log('[Server Wrapper] Stopping Express server...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// Start server immediately and wait for it to be ready
(async () => {
  await startServer();
  console.log('[Server Wrapper] Initialization complete');
})();

// Keep the extension running and handle cleanup
process.on('SIGTERM', () => {
  stopServer();
  process.exit(0);
});

process.on('SIGINT', () => {
  stopServer();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Server Wrapper] Uncaught exception:', err);
  stopServer();
  process.exit(1);
});
