#!/usr/bin/env node

/**
 * Smart Development Startup Script
 * Handles single instance management with user-friendly options
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const LOCK_FILE_PATH = path.join(process.cwd(), '.app-instance.lock');

/**
 * Check if a process with given PID is running
 */
function isProcessRunning(pid) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8' });
      return result.includes(pid.toString());
    } else {
      process.kill(pid, 0);
      return true;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Get current instance info
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
      uptime: Date.now() - lockData.timestamp
    };
  } catch (error) {
    return null;
  }
}

/**
 * Kill existing instance
 */
function killExistingInstance(pid) {
  try {
    console.log(`🔄 Terminating existing instance (PID: ${pid})...`);

    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    } else {
      process.kill(pid, 'SIGTERM');
    }

    // Clean up lock files
    if (fs.existsSync(LOCK_FILE_PATH)) {
      fs.unlinkSync(LOCK_FILE_PATH);
    }

    console.log('✅ Instance terminated successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to terminate instance:', error.message);
    return false;
  }
}

/**
 * Clean up stale files
 */
function cleanup() {
  try {
    if (fs.existsSync(LOCK_FILE_PATH)) {
      fs.unlinkSync(LOCK_FILE_PATH);
    }

    const portConfigPath = path.join(process.cwd(), 'port-config.json');
    if (fs.existsSync(portConfigPath)) {
      fs.unlinkSync(portConfigPath);
    }

    console.log('🧹 Cleanup completed');
  } catch (error) {
    console.error('⚠️ Cleanup failed:', error.message);
  }
}

/**
 * Start development server
 */
function startDev() {
  console.log('🚀 Starting Local Task Tracker development server...\n');

  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  child.on('error', (error) => {
    console.error('❌ Failed to start development server:', error.message);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`\n⚠️ Development server exited with code ${code}`);
    }
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    child.kill('SIGINT');
    process.exit(0);
  });
}

/**
 * Prompt user for choice
 */
function promptUser(question, options) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(question);
    options.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option.text}`);
    });

    rl.question('\nEnter your choice (1-' + options.length + '): ', (answer) => {
      rl.close();
      const choice = parseInt(answer) - 1;
      if (choice >= 0 && choice < options.length) {
        resolve(options[choice].value);
      } else {
        console.log('❌ Invalid choice, exiting...');
        process.exit(1);
      }
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Local Task Tracker Smart Startup\n');

  const instance = getCurrentInstance();

  if (!instance) {
    console.log('✅ No existing instances detected');
    startDev();
    return;
  }

  if (!instance.isRunning) {
    console.log('🧹 Stale lock file detected, cleaning up...');
    cleanup();
    startDev();
    return;
  }

  // Active instance found - show options
  console.log('⚠️  Another instance is already running:');
  console.log(`   PID: ${instance.pid}`);
  console.log(`   Started: ${new Date(instance.timestamp).toLocaleString()}`);
  console.log(`   Uptime: ${Math.floor(instance.uptime / 1000)}s\n`);

  const choice = await promptUser(
    '❓ What would you like to do?',
    [
      { text: 'Terminate existing instance and start new one', value: 'replace' },
      { text: 'Focus existing instance (keep running)', value: 'focus' },
      { text: 'Exit without starting new instance', value: 'exit' }
    ]
  );

  switch (choice) {
    case 'replace':
      if (killExistingInstance(instance.pid)) {
        console.log('🔄 Starting new instance...\n');
        startDev();
      }
      break;

    case 'focus':
      try {
        const net = require('net');
        const client = net.createConnection({ port: 58765 }, () => {
          client.write(JSON.stringify({ action: 'focus', timestamp: Date.now() }));
          client.end();
        });

        client.on('connect', () => {
          console.log('✅ Sent focus command to existing instance');
          console.log('💡 Check your system tray or taskbar for the running application');
        });

        client.on('error', () => {
          console.log('❌ Failed to communicate with existing instance');
        });

        setTimeout(() => process.exit(0), 1000);
      } catch (error) {
        console.log('❌ Failed to focus existing instance');
        process.exit(1);
      }
      break;

    case 'exit':
      console.log('👋 Exiting without changes');
      process.exit(0);
      break;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}