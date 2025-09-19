import { EventEmitter } from 'events';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { logger } from '../utils/logger';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { BackgroundTimerState } from './BackgroundTimerService';

const execAsync = promisify(exec);

export interface TrayMenuAction {
  id: string;
  label: string;
  enabled?: boolean;
  checked?: boolean;
  separator?: boolean;
}

export class SystemTrayService extends EventEmitter {
  private isWindows: boolean;
  private trayProcess: ChildProcess | null = null;
  private currentTimerState: BackgroundTimerState | null = null;
  private performanceMonitor: PerformanceMonitor;
  private trayScriptPath: string;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.isWindows = process.platform === 'win32';
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.trayScriptPath = path.join(os.tmpdir(), 'local-task-tracker-tray.ps1');
  }

  /**
   * Initialize system tray with performance optimization
   */
  public async initialize(): Promise<void> {
    if (!this.isWindows) {
      logger.warn('System tray is only supported on Windows');
      return;
    }

    return this.performanceMonitor.measureOperation('systemTrayInit', async () => {
      try {
        await this.createOptimizedSystemTray();
        this.isInitialized = true;
        logger.info('System tray initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize system tray:', error);
        throw error;
      }
    });
  }

  /**
   * Update tray with timer status
   */
  public updateTimerStatus(timerState: BackgroundTimerState | null): void {
    this.currentTimerState = timerState;
    this.updateTrayIcon();
    this.updateTrayTooltip();
  }

  /**
   * Show tray notification with optimized performance
   */
  public showTrayNotification(title: string, message: string): void {
    if (!this.isWindows || !this.isInitialized) return;

    this.performanceMonitor.measureOperation('trayNotification', async () => {
      try {
        // Use more efficient notification method
        const command = `powershell -WindowStyle Hidden -ExecutionPolicy Bypass -Command "` +
          `Add-Type -AssemblyName System.Windows.Forms; ` +
          `$n = New-Object System.Windows.Forms.NotifyIcon; ` +
          `$n.Icon = [System.Drawing.SystemIcons]::Information; ` +
          `$n.BalloonTipTitle = '${title.replace(/'/g, "''")}'; ` +
          `$n.BalloonTipText = '${message.replace(/'/g, "''")}'; ` +
          `$n.BalloonTipIcon = 'Info'; ` +
          `$n.Visible = $true; ` +
          `$n.ShowBalloonTip(3000); ` +
          `Start-Sleep -Milliseconds 500; ` +
          `$n.Dispose()"`;

        await execAsync(command);
      } catch (error) {
        logger.error('Failed to show tray notification:', error);
      }
    });
  }

  /**
   * Create optimized system tray using cached PowerShell script
   */
  private async createOptimizedSystemTray(): Promise<void> {
    // Create optimized PowerShell script with better performance
    const powershellScript = `# Optimized system tray script for Local Task Tracker
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Performance optimization: Pre-compile script blocks
$openAppAction = {
  try {
    Start-Process "http://localhost:3000" -WindowStyle Hidden
  } catch {
    Write-Host "ERROR_OPEN_APP"
  }
}

$startTimerAction = { Write-Host "START_TIMER" }
$pauseTimerAction = { Write-Host "PAUSE_TIMER" }
$stopTimerAction = { Write-Host "STOP_TIMER" }
$settingsAction = {
  try {
    Start-Process "http://localhost:3000/settings" -WindowStyle Hidden
  } catch {
    Write-Host "ERROR_OPEN_SETTINGS"
  }
}

$aboutAction = {
  [System.Windows.Forms.MessageBox]::Show(
    "Local Task Tracker v1.0\\nA productivity app for focused work sessions.\\n\\nMemory Usage: $([math]::Round((Get-Process -Id $PID).WorkingSet64/1MB, 1))MB",
    "About Local Task Tracker",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
  )
}

$exitAction = {
  $global:trayIcon.Visible = $false
  $global:trayIcon.Dispose()
  Write-Host "EXIT_APP"
  [System.Windows.Forms.Application]::Exit()
}

# Create tray icon with optimized settings
$global:trayIcon = New-Object System.Windows.Forms.NotifyIcon
$global:trayIcon.Icon = [System.Drawing.SystemIcons]::Application
$global:trayIcon.Text = "Local Task Tracker - Ready"
$global:trayIcon.Visible = $true

# Create context menu
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

# Add menu items
$openApp = New-Object System.Windows.Forms.ToolStripMenuItem
$openApp.Text = "Open App"
$openApp.Add_Click($openAppAction)
$contextMenu.Items.Add($openApp)

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$startTimer = New-Object System.Windows.Forms.ToolStripMenuItem
$startTimer.Text = "Start Timer"
$startTimer.Add_Click($startTimerAction)
$contextMenu.Items.Add($startTimer)

$pauseTimer = New-Object System.Windows.Forms.ToolStripMenuItem
$pauseTimer.Text = "Pause Timer"
$pauseTimer.Enabled = $false
$pauseTimer.Add_Click($pauseTimerAction)
$contextMenu.Items.Add($pauseTimer)

$stopTimer = New-Object System.Windows.Forms.ToolStripMenuItem
$stopTimer.Text = "Stop Timer"
$stopTimer.Enabled = $false
$stopTimer.Add_Click($stopTimerAction)
$contextMenu.Items.Add($stopTimer)

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$settings = New-Object System.Windows.Forms.ToolStripMenuItem
$settings.Text = "Settings"
$settings.Add_Click($settingsAction)
$contextMenu.Items.Add($settings)

$about = New-Object System.Windows.Forms.ToolStripMenuItem
$about.Text = "About"
$about.Add_Click($aboutAction)
$contextMenu.Items.Add($about)

$contextMenu.Items.Add((New-Object System.Windows.Forms.ToolStripSeparator))

$exit = New-Object System.Windows.Forms.ToolStripMenuItem
$exit.Text = "Exit"
$exit.Add_Click($exitAction)
$contextMenu.Items.Add($exit)

$global:trayIcon.ContextMenuStrip = $contextMenu

# Double-click handler
$global:trayIcon.Add_DoubleClick($openAppAction)

# Optimize message loop
Write-Host "TRAY_READY"
[System.Windows.Forms.Application]::Run()`;

    // Write optimized script to cached file
    try {
      fs.writeFileSync(this.trayScriptPath, powershellScript, 'utf8');
    } catch (error) {
      logger.error('Failed to write tray script:', error);
      throw error;
    }

    // Execute PowerShell script with optimized parameters
    this.trayProcess = spawn('powershell', [
      '-WindowStyle', 'Hidden',
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-NonInteractive',
      '-File', this.trayScriptPath
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
      windowsHide: true,
    });

    // Handle tray process output with better error handling
    this.trayProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      if (output === 'TRAY_READY') {
        logger.info('System tray is ready');
      } else {
        this.handleTrayAction(output);
      }
    });

    this.trayProcess.stderr?.on('data', (data: Buffer) => {
      const error = data.toString().trim();
      if (error && !error.includes('WARNING')) {
        logger.error('Tray process error:', error);
      }
    });

    this.trayProcess.on('exit', (code: number | null) => {
      logger.info(`Tray process exited with code ${code}`);
      this.trayProcess = null;
      this.isInitialized = false;
      
      // Auto-restart tray if it crashes unexpectedly
      if (code !== 0 && code !== null) {
        logger.warn('Tray process crashed, attempting restart in 5 seconds...');
        setTimeout(() => {
          this.initialize().catch(error => {
            logger.error('Failed to restart tray process:', error);
          });
        }, 5000);
      }
    });

    this.trayProcess.on('error', (error: Error) => {
      logger.error('Tray process spawn error:', error);
      this.trayProcess = null;
      this.isInitialized = false;
    });
  }

  /**
   * Handle tray menu actions
   */
  private handleTrayAction(action: string): void {
    switch (action) {
      case 'START_TIMER':
        this.emit('startTimer');
        break;
      case 'PAUSE_TIMER':
        this.emit('pauseTimer');
        break;
      case 'STOP_TIMER':
        this.emit('stopTimer');
        break;
      case 'EXIT_APP':
        this.emit('exitApp');
        break;
      default:
        logger.debug('Unknown tray action:', action);
    }
  }

  /**
   * Update tray icon based on timer state
   */
  private updateTrayIcon(): void {
    if (!this.isWindows || !this.trayProcess) return;

    let iconType = 'Application';
    
    if (this.currentTimerState) {
      if (this.currentTimerState.isRunning && !this.currentTimerState.isPaused) {
        iconType = 'Shield'; // Running
      } else if (this.currentTimerState.isPaused) {
        iconType = 'Warning'; // Paused
      }
    }

    // Send icon update command to tray process
    // Note: This is a simplified approach. In a real implementation,
    // you might want to use named pipes or other IPC mechanisms
  }

  /**
   * Update tray tooltip
   */
  private updateTrayTooltip(): void {
    if (!this.isWindows || !this.trayProcess) return;

    let tooltip = 'Local Task Tracker - Ready';
    
    if (this.currentTimerState) {
      const sessionType = this.getSessionTypeDisplayName(this.currentTimerState.sessionType);
      
      if (this.currentTimerState.isRunning && !this.currentTimerState.isPaused) {
        tooltip = `Local Task Tracker - ${sessionType} Running`;
      } else if (this.currentTimerState.isPaused) {
        tooltip = `Local Task Tracker - ${sessionType} Paused`;
      }
    }

    // Send tooltip update command to tray process
    // Note: This is a simplified approach
  }

  /**
   * Get display name for session type
   */
  private getSessionTypeDisplayName(sessionType: string): string {
    switch (sessionType) {
      case 'deep_work':
        return 'Deep Work';
      case 'quick_task':
        return 'Quick Task';
      case 'break':
        return 'Break Time';
      case 'custom':
        return 'Custom Session';
      default:
        return 'Focus Session';
    }
  }

  /**
   * Show context menu programmatically
   */
  public showContextMenu(): void {
    if (!this.isWindows || !this.trayProcess) return;
    
    // Send command to show context menu
    // This would require more sophisticated IPC in a real implementation
  }

  /**
   * Update menu item states
   */
  public updateMenuStates(canStart: boolean, canPause: boolean, canStop: boolean): void {
    if (!this.isWindows || !this.trayProcess) return;

    // Send menu state updates to tray process
    // This would require more sophisticated IPC in a real implementation
    logger.debug('Menu states updated:', { canStart, canPause, canStop });
  }

  /**
   * Cleanup system tray with proper resource management
   */
  public cleanup(): void {
    if (this.trayProcess) {
      try {
        // Gracefully terminate the tray process
        this.trayProcess.kill('SIGTERM');
        
        // Force kill if it doesn't respond within 3 seconds
        setTimeout(() => {
          if (this.trayProcess && !this.trayProcess.killed) {
            this.trayProcess.kill('SIGKILL');
          }
        }, 3000);
        
        this.trayProcess = null;
        this.isInitialized = false;
        logger.info('System tray cleaned up');
      } catch (error) {
        logger.error('Error during tray cleanup:', error);
      }
    }

    // Clean up temporary script file
    try {
      if (fs.existsSync(this.trayScriptPath)) {
        fs.unlinkSync(this.trayScriptPath);
      }
    } catch (error) {
      logger.debug('Could not clean up tray script file:', error);
    }
  }

  /**
   * Check if system tray is supported
   */
  public isSupported(): boolean {
    return this.isWindows;
  }

  /**
   * Get comprehensive tray status
   */
  public getStatus(): { 
    supported: boolean; 
    active: boolean; 
    initialized: boolean;
    timerState: BackgroundTimerState | null;
    processId?: number;
  } {
    const status = {
      supported: this.isWindows,
      active: this.trayProcess !== null && !this.trayProcess.killed,
      initialized: this.isInitialized,
      timerState: this.currentTimerState,
    } as {
      supported: boolean;
      active: boolean;
      initialized: boolean;
      timerState: BackgroundTimerState | null;
      processId?: number;
    };

    if (this.trayProcess?.pid) {
      status.processId = this.trayProcess.pid;
    }

    return status;
  }

  /**
   * Update menu item states efficiently
   */
  public updateMenuStatesOptimized(canStart: boolean, canPause: boolean, canStop: boolean): void {
    if (!this.isWindows || !this.isInitialized || !this.trayProcess) return;

    // Send menu state updates via stdin (more efficient than recreating the tray)
    try {
      const stateUpdate = JSON.stringify({
        action: 'updateMenuStates',
        canStart,
        canPause,
        canStop
      });
      
      this.trayProcess.stdin?.write(stateUpdate + '\n');
    } catch (error) {
      logger.debug('Could not update menu states:', error);
    }
  }

  /**
   * Get performance metrics for the tray service
   */
  public getPerformanceMetrics(): any {
    return this.performanceMonitor.getMetricStats('systemTrayInit');
  }
}