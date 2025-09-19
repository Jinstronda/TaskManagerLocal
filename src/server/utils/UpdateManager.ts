import { promises as fs } from 'fs';
import path from 'path';
import { logger } from './logger';

/**
 * Simple update mechanism for Local Task Tracker
 * Handles file replacement updates for the Windows executable
 */
export class UpdateManager {
  private static instance: UpdateManager;
  private currentVersion: string;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.currentVersion = this.getCurrentVersion();
  }

  public static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }

  /**
   * Get current application version from package.json
   */
  private getCurrentVersion(): string {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = require(packagePath);
      return packageJson.version || '1.0.0';
    } catch (error) {
      logger.warn('Could not read version from package.json:', error);
      return '1.0.0';
    }
  }

  /**
   * Check for updates (placeholder for future implementation)
   */
  public async checkForUpdates(): Promise<{
    hasUpdate: boolean;
    currentVersion: string;
    latestVersion?: string;
    updateUrl?: string;
  }> {
    // For now, this is a placeholder that always returns no updates
    // In a real implementation, this would check a remote server or GitHub releases
    
    logger.info(`Checking for updates... Current version: ${this.currentVersion}`);
    
    return {
      hasUpdate: false,
      currentVersion: this.currentVersion
    };
  }

  /**
   * Download and prepare update (placeholder)
   */
  public async downloadUpdate(updateUrl: string): Promise<string> {
    // Placeholder for downloading update file
    // In a real implementation, this would download the new executable
    
    logger.info(`Downloading update from: ${updateUrl}`);
    
    // Return path to downloaded update file
    return path.join(process.cwd(), 'update', 'local-task-tracker-new.exe');
  }

  /**
   * Apply update by replacing the current executable
   */
  public async applyUpdate(updateFilePath: string): Promise<void> {
    try {
      const currentExePath = process.execPath;
      const backupPath = `${currentExePath}.backup`;
      
      logger.info('Applying update...');
      
      // Create backup of current executable
      await fs.copyFile(currentExePath, backupPath);
      logger.info('Created backup of current executable');
      
      // Replace current executable with update
      await fs.copyFile(updateFilePath, currentExePath);
      logger.info('Update applied successfully');
      
      // Clean up update file
      await fs.unlink(updateFilePath);
      
      // Schedule restart
      this.scheduleRestart();
      
    } catch (error) {
      logger.error('Failed to apply update:', error);
      throw error;
    }
  }

  /**
   * Schedule application restart after update
   */
  private scheduleRestart(): void {
    logger.info('Scheduling application restart in 3 seconds...');
    
    setTimeout(() => {
      logger.info('Restarting application after update...');
      process.exit(0); // The service manager will restart the application
    }, 3000);
  }

  /**
   * Start automatic update checking
   */
  public startUpdateChecking(intervalHours: number = 24): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    this.updateCheckInterval = setInterval(async () => {
      try {
        const updateInfo = await this.checkForUpdates();
        
        if (updateInfo.hasUpdate) {
          logger.info(`Update available: ${updateInfo.latestVersion}`);
          // In a real implementation, you might want to notify the user
          // or automatically download and apply the update
        }
      } catch (error) {
        logger.error('Error checking for updates:', error);
      }
    }, intervalMs);

    logger.info(`Automatic update checking started (every ${intervalHours} hours)`);
  }

  /**
   * Stop automatic update checking
   */
  public stopUpdateChecking(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      logger.info('Automatic update checking stopped');
    }
  }

  /**
   * Get update status
   */
  public getUpdateStatus(): {
    currentVersion: string;
    autoUpdateEnabled: boolean;
    lastCheckTime?: Date;
  } {
    return {
      currentVersion: this.currentVersion,
      autoUpdateEnabled: this.updateCheckInterval !== null,
      // In a real implementation, you'd track the last check time
    };
  }

  /**
   * Create update directory if it doesn't exist
   */
  private async ensureUpdateDirectory(): Promise<string> {
    const updateDir = path.join(process.cwd(), 'update');
    
    try {
      await fs.access(updateDir);
    } catch {
      await fs.mkdir(updateDir, { recursive: true });
    }
    
    return updateDir;
  }

  /**
   * Cleanup old backup files
   */
  public async cleanupBackups(): Promise<void> {
    try {
      const currentExePath = process.execPath;
      const backupPath = `${currentExePath}.backup`;
      
      // Check if backup exists and remove it
      try {
        await fs.access(backupPath);
        await fs.unlink(backupPath);
        logger.info('Cleaned up old backup file');
      } catch {
        // Backup doesn't exist, which is fine
      }
    } catch (error) {
      logger.warn('Error cleaning up backups:', error);
    }
  }

  /**
   * Validate update file before applying
   */
  private async validateUpdateFile(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      
      // Basic validation - check if file exists and has reasonable size
      if (stats.size < 1024 * 1024) { // Less than 1MB is suspicious
        logger.warn('Update file seems too small');
        return false;
      }
      
      if (stats.size > 500 * 1024 * 1024) { // More than 500MB is suspicious
        logger.warn('Update file seems too large');
        return false;
      }
      
      // In a real implementation, you'd verify file signatures, checksums, etc.
      
      return true;
    } catch (error) {
      logger.error('Error validating update file:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopUpdateChecking();
  }
}

export const updateManager = UpdateManager.getInstance();