import { createServer, Server } from 'net';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Single Instance Manager - Ensures only one instance of the application runs
 * Uses a combination of file locking and TCP port binding for robust detection
 */
export class SingleInstanceManager {
  private static instance: SingleInstanceManager;
  private lockFilePath: string;
  private lockServer: Server | null = null;
  private lockPort: number;
  private isLocked = false;

  private constructor() {
    this.lockFilePath = path.join(process.cwd(), '.app-instance.lock');
    this.lockPort = 58765; // High port number to avoid conflicts
  }

  public static getInstance(): SingleInstanceManager {
    if (!SingleInstanceManager.instance) {
      SingleInstanceManager.instance = new SingleInstanceManager();
    }
    return SingleInstanceManager.instance;
  }

  /**
   * Attempt to acquire the single instance lock
   * Returns true if successful, false if another instance is running
   */
  public async acquireLock(): Promise<boolean> {
    try {
      // First, try to bind to the lock port
      const portAvailable = await this.tryBindLockPort();
      if (!portAvailable) {
        logger.info('Another instance detected via port binding');
        await this.showDuplicateInstanceWarning();
        return false;
      }

      // Check for existing lock file
      if (await this.isLockFileActive()) {
        logger.info('Another instance detected via lock file');
        this.releaseLockPort();
        await this.showDuplicateInstanceWarning();
        return false;
      }

      // Create lock file with current process info
      await this.createLockFile();
      this.isLocked = true;

      logger.info('Single instance lock acquired successfully');
      return true;

    } catch (error) {
      logger.error('Error acquiring single instance lock:', error);
      return false;
    }
  }

  /**
   * Show detailed warning about duplicate instance with helpful instructions
   */
  private async showDuplicateInstanceWarning(): Promise<void> {
    const lockInfo = this.getLockInfo();

    logger.warn('╔══════════════════════════════════════════════════════════════╗');
    logger.warn('║                    ⚠️  DUPLICATE INSTANCE DETECTED           ║');
    logger.warn('╠══════════════════════════════════════════════════════════════╣');
    logger.warn('║ Another instance of Local Task Tracker is already running!   ║');

    if (lockInfo) {
      logger.warn(`║ • PID: ${lockInfo.pid.toString().padEnd(53)}║`);
      logger.warn(`║ • Started: ${new Date(lockInfo.timestamp).toLocaleString().padEnd(46)}║`);
      const uptime = Math.floor((Date.now() - lockInfo.timestamp) / 1000);
      logger.warn(`║ • Uptime: ${uptime}s${' '.repeat(51 - uptime.toString().length)}║`);
    }

    logger.warn('║                                                              ║');
    logger.warn('║ 💡 To manage instances, use these commands:                  ║');
    logger.warn('║    npm run instances:status  - Check running instances      ║');
    logger.warn('║    npm run instances:kill    - Terminate all instances      ║');
    logger.warn('║    npm run instances:cleanup - Clean up stale files         ║');
    logger.warn('║    npm run instances:focus   - Focus existing instance      ║');
    logger.warn('╚══════════════════════════════════════════════════════════════╝');
  }

  /**
   * Try to bind to the lock port to detect other instances
   */
  private async tryBindLockPort(): Promise<boolean> {
    return new Promise((resolve) => {
      this.lockServer = createServer();
      
      this.lockServer.listen(this.lockPort, () => {
        logger.debug(`Lock port ${this.lockPort} bound successfully`);
        resolve(true);
      });

      this.lockServer.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.debug(`Lock port ${this.lockPort} is in use`);
          resolve(false);
        } else {
          logger.error('Lock server error:', error);
          resolve(false);
        }
      });
    });
  }

  /**
   * Release the lock port
   */
  private releaseLockPort(): void {
    if (this.lockServer) {
      this.lockServer.close();
      this.lockServer = null;
    }
  }

  /**
   * Check if the lock file exists and represents an active process
   */
  private async isLockFileActive(): Promise<boolean> {
    try {
      if (!fs.existsSync(this.lockFilePath)) {
        return false;
      }

      const lockData = JSON.parse(fs.readFileSync(this.lockFilePath, 'utf8'));
      const { pid, timestamp } = lockData;

      // Check if the process is still running
      if (await this.isProcessRunning(pid)) {
        // Check if the lock is not too old (stale lock protection)
        const lockAge = Date.now() - timestamp;
        const maxLockAge = 5 * 60 * 1000; // 5 minutes

        if (lockAge < maxLockAge) {
          return true;
        } else {
          logger.warn(`Stale lock file detected (age: ${lockAge}ms), removing...`);
          await this.removeLockFile();
          return false;
        }
      } else {
        logger.info('Lock file exists but process is not running, removing stale lock');
        await this.removeLockFile();
        return false;
      }
    } catch (error) {
      logger.error('Error checking lock file:', error);
      // If we can't read the lock file, assume it's stale
      await this.removeLockFile();
      return false;
    }
  }

  /**
   * Check if a process with the given PID is running
   */
  private async isProcessRunning(pid: number): Promise<boolean> {
    try {
      // On Windows, use tasklist; on Unix, use kill -0
      if (process.platform === 'win32') {
        const { execSync } = require('child_process');
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
   * Create the lock file with current process information
   */
  private async createLockFile(): Promise<void> {
    const lockData = {
      pid: process.pid,
      timestamp: Date.now(),
      startTime: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    };

    fs.writeFileSync(this.lockFilePath, JSON.stringify(lockData, null, 2));
    logger.debug(`Lock file created: ${this.lockFilePath}`);
  }

  /**
   * Remove the lock file
   */
  private async removeLockFile(): Promise<void> {
    try {
      if (fs.existsSync(this.lockFilePath)) {
        fs.unlinkSync(this.lockFilePath);
        logger.debug('Lock file removed');
      }
    } catch (error) {
      logger.error('Error removing lock file:', error);
    }
  }

  /**
   * Release the single instance lock
   */
  public async releaseLock(): Promise<void> {
    if (this.isLocked) {
      this.releaseLockPort();
      await this.removeLockFile();
      this.isLocked = false;
      logger.info('Single instance lock released');
    }
  }

  /**
   * Try to communicate with existing instance
   * This could be extended to send commands to the existing instance
   */
  public async notifyExistingInstance(message: string = 'focus'): Promise<boolean> {
    try {
      // Try to connect to the lock port to send a message
      const net = require('net');
      const client = net.createConnection({ port: this.lockPort }, () => {
        client.write(JSON.stringify({ action: message, timestamp: Date.now() }));
        client.end();
      });

      return new Promise((resolve) => {
        client.on('connect', () => {
          logger.info('Notified existing instance');
          resolve(true);
        });

        client.on('error', () => {
          resolve(false);
        });

        setTimeout(() => resolve(false), 1000);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Set up listener for messages from other instances
   */
  public setupInstanceCommunication(onMessage: (message: any) => void): void {
    if (this.lockServer) {
      this.lockServer.on('connection', (socket) => {
        // Add error handler to prevent crashes
        socket.on('error', (err) => {
          // Silently ignore connection errors (ECONNRESET, etc)
          logger.debug('Socket error (ignored):', err.message);
        });
        
        socket.on('data', (data) => {
          try {
            const message = JSON.parse(data.toString());
            logger.info('Received message from another instance:', message);
            onMessage(message);
          } catch (error) {
            logger.error('Error parsing instance message:', error);
          }
        });
      });
    }
  }

  /**
   * Get information about the current lock
   */
  public getLockInfo(): any {
    try {
      if (fs.existsSync(this.lockFilePath)) {
        return JSON.parse(fs.readFileSync(this.lockFilePath, 'utf8'));
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const singleInstanceManager = SingleInstanceManager.getInstance();