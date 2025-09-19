#!/usr/bin/env node

/**
 * Instance Management Utility
 * Helps check, manage, and control multiple server instances
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOCK_FILE_PATH = path.join(process.cwd(), '.app-instance.lock');
const LOCK_PORT = 58765;

/**
 * Check if a process with given PID is running
 */
function isProcessRunning(pid) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8' });
      return result.includes(pid.toString());
    } else {
      process.kill(pid, 0); // This throws if process doesn't exist
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Get information about current running instance
 */
function getCurrentInstance() {
  try {
    if (!fs.existsSync(LOCK_FILE_PATH)) {
      return null;
    }

    const lockData = JSON.parse(fs.readFileSync(LOCK_FILE_PATH, 'utf8'));
    const isRunning = isProcessRunning(lockData.pid);

    return {
      ...lockData,
      isRunning,
      lockAge: Date.now() - lockData.timestamp,
      uptime: Date.now() - lockData.timestamp
    };
  } catch (error) {
    return null;
  }
}

/**
 * Kill all running instances
 */
function killAllInstances() {
  const instance = getCurrentInstance();

  if (!instance) {
    console.log('❌ No running instances found');
    return false;
  }

  if (!instance.isRunning) {
    console.log('❌ No active instances found (stale lock file detected)');
    cleanupStaleFiles();
    return false;
  }

  try {
    console.log(`🔄 Terminating instance (PID: ${instance.pid})...`);

    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${instance.pid} /F`, { stdio: 'inherit' });
    } else {
      process.kill(instance.pid, 'SIGTERM');

      // Give it time to gracefully shutdown
      setTimeout(() => {
        if (isProcessRunning(instance.pid)) {
          process.kill(instance.pid, 'SIGKILL');
        }
      }, 5000);
    }

    console.log('✅ Instance terminated successfully');
    cleanupStaleFiles();
    return true;
  } catch (error) {
    console.error('❌ Failed to terminate instance:', error.message);
    return false;
  }
}

/**
 * Clean up stale lock files and ports
 */
function cleanupStaleFiles() {
  try {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      fs.unlinkSync(LOCK_FILE_PATH);
      console.log('🧹 Cleaned up lock file');
    }

    // Clean up port config if it exists
    const portConfigPath = path.join(process.cwd(), 'port-config.json');
    if (fs.existsSync(portConfigPath)) {
      fs.unlinkSync(portConfigPath);
      console.log('🧹 Cleaned up port config');
    }
  } catch (error) {
    console.error('⚠️ Failed to cleanup files:', error.message);
  }
}

/**
 * Display status of current instances
 */
function showStatus() {
  const instance = getCurrentInstance();

  console.log('🔍 Local Task Tracker Instance Status');
  console.log('=====================================');

  if (!instance) {
    console.log('✅ No instances currently running');
    console.log('💡 You can safely start a new instance with: npm run dev');
    return;
  }

  console.log(`📍 Instance found:`);
  console.log(`   PID: ${instance.pid}`);
  console.log(`   Started: ${instance.startTime}`);
  console.log(`   Version: ${instance.version}`);
  console.log(`   Uptime: ${Math.floor(instance.uptime / 1000)}s`);
  console.log(`   Status: ${instance.isRunning ? '🟢 Running' : '🔴 Not running (stale)'}`);

  if (!instance.isRunning) {
    console.log('⚠️  Stale lock file detected - run "cleanup" to remove it');
  }
}

/**
 * Try to focus existing instance
 */
function focusInstance() {
  const instance = getCurrentInstance();

  if (!instance || !instance.isRunning) {
    console.log('❌ No running instance to focus');
    return false;
  }

  try {
    const net = require('net');
    const client = net.createConnection({ port: LOCK_PORT }, () => {
      client.write(JSON.stringify({ action: 'focus', timestamp: Date.now() }));
      client.end();
    });

    client.on('connect', () => {
      console.log('✅ Sent focus command to existing instance');
    });

    client.on('error', () => {
      console.log('❌ Failed to communicate with existing instance');
    });

    return true;
  } catch (error) {
    console.log('❌ Failed to focus instance:', error.message);
    return false;
  }
}

/**
 * Main command handler
 */
function main() {
  const command = process.argv[2];

  switch (command) {
    case 'status':
    case 'check':
      showStatus();
      break;

    case 'kill':
    case 'terminate':
      killAllInstances();
      break;

    case 'cleanup':
      cleanupStaleFiles();
      console.log('✅ Cleanup completed');
      break;

    case 'focus':
      focusInstance();
      break;

    case 'help':
    case '--help':
    case '-h':
      console.log('🔧 Local Task Tracker Instance Manager');
      console.log('Usage: node scripts/check-instances.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  status    - Show current instance status');
      console.log('  kill      - Terminate all running instances');
      console.log('  cleanup   - Clean up stale lock files');
      console.log('  focus     - Send focus command to existing instance');
      console.log('  help      - Show this help message');
      break;

    default:
      console.log('🔍 Checking instance status...\n');
      showStatus();
      console.log('\n💡 Use "node scripts/check-instances.js help" for more options');
      break;
  }
}

if (require.main === module) {
  main();
}