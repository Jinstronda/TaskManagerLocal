import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import { UserSettingsRepository } from '../database/repositories/UserSettingsRepository';
import { SessionRepository } from '../database/repositories/SessionRepository';
import { DailyStatsRepository } from '../database/repositories/DailyStatsRepository';
import { NotificationPreferences, BreakSuggestion, ReviewPrompt, ReviewQuestion } from '../../shared/types';

const execAsync = promisify(exec);

export interface NotificationOptions {
  title: string;
  message: string;
  icon?: string;
  sound?: boolean;
  duration?: number; // in seconds
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
}

export class NotificationService {
  private isWindows: boolean;
  private userSettingsRepo: UserSettingsRepository;
  private sessionRepo: SessionRepository;
  private dailyStatsRepo: DailyStatsRepository;
  private reviewPrompts: Map<string, ReviewPrompt> = new Map();
  private scheduledReviews: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.isWindows = process.platform === 'win32';
    this.userSettingsRepo = new UserSettingsRepository();
    this.sessionRepo = new SessionRepository();
    this.dailyStatsRepo = new DailyStatsRepository();
    // TODO: Initialize review scheduling
  }

  /**
   * Show a native system notification
   */
  public async showNotification(options: NotificationOptions): Promise<void> {
    try {
      if (this.isWindows) {
        await this.showWindowsNotification(options);
      } else {
        // Fallback for other platforms
        await this.showFallbackNotification(options);
      }
    } catch (error) {
      logger.error('Failed to show notification:', error);
    }
  }

  /**
   * Show session completion notification
   */
  public async showSessionCompleteNotification(
    sessionType: string,
    duration: number,
    taskTitle?: string
  ): Promise<void> {
    const title = 'Session Complete! 🎉';
    const sessionName = this.getSessionTypeDisplayName(sessionType);
    const taskInfo = taskTitle ? ` on "${taskTitle}"` : '';
    const message = `${sessionName} session completed${taskInfo}. Duration: ${duration} minutes.`;

    await this.showNotification({
      title,
      message,
      icon: 'success',
      sound: true,
      duration: 10,
    });
  }

  /**
   * Show break reminder notification
   */
  public async showBreakReminderNotification(sessionCount: number): Promise<void> {
    const title = 'Time for a Break! ☕';
    const message = `You've completed ${sessionCount} focus sessions. Consider taking a short break to recharge.`;

    await this.showNotification({
      title,
      message,
      icon: 'info',
      sound: true,
      duration: 15,
      actions: [
        { id: 'start_break', title: 'Start Break' },
        { id: 'continue_working', title: 'Continue Working' },
      ],
    });
  }

  /**
   * Show idle detection notification
   */
  public async showIdleDetectionNotification(): Promise<void> {
    const title = 'Are you still there? 🤔';
    const message = 'You seem to be away from your computer. Would you like to pause the timer?';

    await this.showNotification({
      title,
      message,
      icon: 'question',
      sound: false,
      duration: 30,
      actions: [
        { id: 'pause_timer', title: 'Pause Timer' },
        { id: 'continue_session', title: 'Continue Session' },
      ],
    });
  }

  /**
   * Show system sleep detection notification
   */
  public async showSleepDetectionNotification(gapDuration: number): Promise<void> {
    const title = 'System Sleep Detected 😴';
    const message = `Your computer was asleep for ${Math.round(gapDuration / 60)} minutes. The timer has been paused.`;

    await this.showNotification({
      title,
      message,
      icon: 'warning',
      sound: true,
      duration: 20,
      actions: [
        { id: 'resume_timer', title: 'Resume Timer' },
        { id: 'stop_session', title: 'Stop Session' },
      ],
    });
  }

  /**
   * Show daily goal achievement notification
   */
  public async showGoalAchievementNotification(
    categoryName: string,
    goalMinutes: number
  ): Promise<void> {
    const title = 'Goal Achieved! 🏆';
    const message = `Congratulations! You've reached your daily goal of ${goalMinutes} minutes for ${categoryName}.`;

    await this.showNotification({
      title,
      message,
      icon: 'success',
      sound: true,
      duration: 10,
    });
  }

  /**
   * Show streak milestone notification
   */
  public async showStreakMilestoneNotification(streakDays: number): Promise<void> {
    const title = 'Streak Milestone! 🔥';
    const message = `Amazing! You've maintained your focus streak for ${streakDays} days in a row!`;

    await this.showNotification({
      title,
      message,
      icon: 'success',
      sound: true,
      duration: 15,
    });
  }

  /**
   * Show Windows notification using PowerShell
   */
  private async showWindowsNotification(options: NotificationOptions): Promise<void> {
    const { title, message, duration = 10 } = options;
    
    // Escape quotes and special characters for PowerShell
    const escapedTitle = title.replace(/"/g, '""').replace(/'/g, "''");
    const escapedMessage = message.replace(/"/g, '""').replace(/'/g, "''");
    
    // Create PowerShell script for Windows 10/11 toast notification
    const powershellScript = `
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      [Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

      $APP_ID = 'LocalTaskTracker'
      
      $template = @"
      <toast>
        <visual>
          <binding template="ToastGeneric">
            <text>${escapedTitle}</text>
            <text>${escapedMessage}</text>
          </binding>
        </visual>
        <audio src="ms-winsoundevent:Notification.Default" />
      </toast>
"@

      $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
      $xml.LoadXml($template)
      $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
      $toast.ExpirationTime = [DateTimeOffset]::Now.AddSeconds(${duration})
      
      $notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID)
      $notifier.Show($toast)
    `;

    try {
      await execAsync(`powershell -Command "${powershellScript.replace(/"/g, '\\"')}"`);
      logger.info(`Windows notification shown: ${title}`);
    } catch (error) {
      logger.warn('Failed to show Windows toast notification, falling back to balloon tip');
      await this.showWindowsBalloonNotification(options);
    }
  }

  /**
   * Show Windows balloon notification as fallback
   */
  private async showWindowsBalloonNotification(options: NotificationOptions): Promise<void> {
    const { title, message } = options;
    
    // Use PowerShell to show a balloon tip notification
    const powershellScript = `
      Add-Type -AssemblyName System.Windows.Forms
      $balloon = New-Object System.Windows.Forms.NotifyIcon
      $balloon.Icon = [System.Drawing.SystemIcons]::Information
      $balloon.BalloonTipTitle = "${title.replace(/"/g, '""')}"
      $balloon.BalloonTipText = "${message.replace(/"/g, '""')}"
      $balloon.BalloonTipIcon = "Info"
      $balloon.Visible = $true
      $balloon.ShowBalloonTip(10000)
      Start-Sleep -Seconds 1
      $balloon.Dispose()
    `;

    try {
      await execAsync(`powershell -Command "${powershellScript}"`);
      logger.info(`Windows balloon notification shown: ${title}`);
    } catch (error) {
      logger.error('Failed to show Windows balloon notification:', error);
    }
  }

  /**
   * Show fallback notification for non-Windows platforms
   */
  private async showFallbackNotification(options: NotificationOptions): Promise<void> {
    const { title, message } = options;
    
    // Log the notification as fallback
    logger.info(`NOTIFICATION: ${title} - ${message}`);
    
    // Try to use node-notifier if available
    try {
      const notifier = require('node-notifier');
      notifier.notify({
        title,
        message,
        sound: options.sound !== false,
        wait: false,
      });
    } catch (error) {
      // node-notifier not available, just log
      logger.warn('node-notifier not available, notification logged only');
    }
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
   * Test notification system
   */
  public async testNotification(): Promise<void> {
    await this.showNotification({
      title: 'Local Task Tracker',
      message: 'Notification system is working correctly!',
      icon: 'info',
      sound: true,
      duration: 5,
    });
  }
}