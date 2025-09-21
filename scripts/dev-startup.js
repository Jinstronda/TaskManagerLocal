const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPort(port, timeout = 5000) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      timeout: timeout
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function waitForPort(port, maxAttempts = 30, interval = 1000) {
  log(`⏳ Waiting for port ${port} to be available...`, colors.yellow);

  for (let i = 0; i < maxAttempts; i++) {
    const isReady = await checkPort(port);
    if (isReady) {
      log(`✅ Port ${port} is ready!`, colors.green);
      return true;
    }

    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  log(`\n❌ Port ${port} failed to become ready after ${maxAttempts} attempts`, colors.red);
  return false;
}

async function startDevelopment() {
  log('🚀 Starting Local Task Tracker Development Environment', colors.bright + colors.cyan);
  log('================================================', colors.cyan);

  const projectRoot = path.resolve(__dirname, '..');

  // Check if servers are already running
  const backendRunning = await checkPort(8765);
  const frontendRunning = await checkPort(3000);

  if (backendRunning && frontendRunning) {
    log('✅ Both servers are already running!', colors.green);
    log('🔗 Backend: http://localhost:8765', colors.blue);
    log('🔗 Frontend: http://localhost:3000', colors.blue);
    return;
  }

  // Start backend if not running
  if (!backendRunning) {
    log('🔧 Starting backend server...', colors.yellow);

    const backend = spawn('npm', ['run', 'server:dev'], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true
    });

    backend.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on')) {
        log('✅ Backend server started successfully!', colors.green);
      }
    });

    backend.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('[nodemon]') && !error.includes('starting')) {
        log(`❌ Backend error: ${error}`, colors.red);
      }
    });

    // Wait for backend to be ready
    const backendReady = await waitForPort(8765);
    if (!backendReady) {
      log('❌ Failed to start backend server', colors.red);
      process.exit(1);
    }
  } else {
    log('✅ Backend server already running on port 8765', colors.green);
  }

  // Start frontend if not running
  if (!frontendRunning) {
    log('🎨 Starting frontend server...', colors.yellow);

    const frontend = spawn('npm', ['run', 'client:dev'], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true
    });

    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:')) {
        log('✅ Frontend server started successfully!', colors.green);
      }
    });

    frontend.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('vite') && error.trim()) {
        log(`❌ Frontend error: ${error}`, colors.red);
      }
    });

    // Wait for frontend to be ready
    const frontendReady = await waitForPort(3000);
    if (!frontendReady) {
      log('❌ Failed to start frontend server', colors.red);
      process.exit(1);
    }
  } else {
    log('✅ Frontend server already running on port 3000', colors.green);
  }

  log('\n🎉 Development environment is ready!', colors.bright + colors.green);
  log('================================================', colors.green);
  log('🔗 Open http://localhost:3000 in your browser', colors.blue);
  log('🔧 Backend API: http://localhost:8765/api', colors.blue);
  log('📊 Health Check: http://localhost:8765/api/health', colors.blue);
  log('================================================', colors.green);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Shutting down development environment...', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Shutting down development environment...', colors.yellow);
  process.exit(0);
});

startDevelopment().catch((error) => {
  log(`💥 Failed to start development environment: ${error.message}`, colors.red);
  process.exit(1);
});