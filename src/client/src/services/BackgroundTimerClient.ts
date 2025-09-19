import { Session } from '../../../shared/types';

export interface BackgroundTimerStatus {
  timerState: any;
  remainingTime: number;
  isIdle: boolean;
}

export class BackgroundTimerClient {
  private clientId: string;
  private heartbeatInterval: number | null = null;
  private statusCheckInterval: number | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly STATUS_CHECK_INTERVAL = 1000; // 1 second

  constructor() {
    this.clientId = this.generateClientId();
    this.startHeartbeat();
  }

  /**
   * Start a background timer on the server
   */
  public async startTimer(
    sessionType: Session['sessionType'],
    plannedDuration: number,
    taskId?: number,
    categoryId?: number
  ): Promise<{ sessionId: number; timerState: any }> {
    const response = await fetch('/api/timer/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.clientId,
      },
      body: JSON.stringify({
        sessionType,
        plannedDuration,
        taskId,
        categoryId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to start background timer');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to start background timer');
    }

    this.startStatusChecking();
    return result.data;
  }

  /**
   * Pause the background timer
   */
  public async pauseTimer(): Promise<void> {
    const response = await fetch('/api/timer/pause', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to pause background timer');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to pause background timer');
    }
  }

  /**
   * Resume the background timer
   */
  public async resumeTimer(): Promise<void> {
    const response = await fetch('/api/timer/resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to resume background timer');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to resume background timer');
    }

    this.startStatusChecking();
  }

  /**
   * Stop the background timer
   */
  public async stopTimer(): Promise<void> {
    const response = await fetch('/api/timer/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to stop background timer');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to stop background timer');
    }

    this.stopStatusChecking();
  }

  /**
   * Complete the background timer
   */
  public async completeTimer(qualityRating?: number, notes?: string): Promise<void> {
    const response = await fetch('/api/timer/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': this.clientId,
      },
      body: JSON.stringify({
        qualityRating,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to complete background timer');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to complete background timer');
    }

    this.stopStatusChecking();
  }

  /**
   * Get timer status from server
   */
  public async getTimerStatus(): Promise<BackgroundTimerStatus> {
    const response = await fetch('/api/timer/status', {
      method: 'GET',
      headers: {
        'X-Client-Id': this.clientId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get timer status');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to get timer status');
    }

    return result.data;
  }

  /**
   * Test notification system
   */
  public async testNotification(): Promise<void> {
    const response = await fetch('/api/timer/test-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to send test notification');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to send test notification');
    }
  }

  /**
   * Get system tray status
   */
  public async getTrayStatus(): Promise<any> {
    const response = await fetch('/api/timer/tray-status', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to get tray status');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to get tray status');
    }

    return result.data;
  }

  /**
   * Start sending heartbeat to server for idle detection
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = window.setInterval(async () => {
      try {
        await fetch('/api/timer/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Id': this.clientId,
          },
        });
      } catch (error) {
        console.warn('Failed to send heartbeat:', error);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop sending heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Start checking timer status periodically
   */
  private startStatusChecking(): void {
    if (this.statusCheckInterval) return;

    let consecutiveFailures = 0;
    const maxFailures = 5;
    let isBackendAvailable = true;

    this.statusCheckInterval = window.setInterval(async () => {
      try {
        const status = await this.getTimerStatus();

        // Reset failure count on successful request
        if (consecutiveFailures > 0) {
          consecutiveFailures = 0;
          console.log('🟢 Backend connection restored');

          // Emit connection restored event
          window.dispatchEvent(new CustomEvent('timerConnectionRestored', {
            detail: { reconnected: true },
          }));
        }

        isBackendAvailable = true;

        // Emit status update event
        window.dispatchEvent(new CustomEvent('timerStatusUpdate', {
          detail: status,
        }));
      } catch (error) {
        consecutiveFailures++;

        // Only log every few failures to avoid spam
        if (consecutiveFailures <= 3 || consecutiveFailures % 5 === 0) {
          console.warn(`🔴 Failed to check timer status (${consecutiveFailures}/${maxFailures}):`, error);
        }

        // If backend becomes unavailable, emit connection lost event
        if (isBackendAvailable && consecutiveFailures >= 3) {
          isBackendAvailable = false;
          console.warn('⚠️ Backend connection lost, timer may be out of sync');

          window.dispatchEvent(new CustomEvent('timerConnectionLost', {
            detail: {
              failureCount: consecutiveFailures,
              message: 'Backend connection lost, timer may be out of sync'
            },
          }));
        }

        // Stop checking after too many failures to prevent resource waste
        if (consecutiveFailures >= maxFailures) {
          console.error(`❌ Stopping status checks after ${maxFailures} consecutive failures`);
          this.stopStatusChecking();

          window.dispatchEvent(new CustomEvent('timerConnectionFailed', {
            detail: {
              message: 'Timer synchronization failed, please refresh the page'
            },
          }));
        }
      }
    }, this.STATUS_CHECK_INTERVAL);
  }

  /**
   * Stop checking timer status
   */
  private stopStatusChecking(): void {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  /**
   * Attempt to restore connection and restart status checking
   */
  public async attemptReconnection(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to reconnect to backend...');
      const status = await this.getTimerStatus();

      // If successful, restart status checking
      this.startStatusChecking();

      console.log('✅ Reconnection successful');
      window.dispatchEvent(new CustomEvent('timerConnectionRestored', {
        detail: { reconnected: true, manual: true },
      }));

      return true;
    } catch (error) {
      console.warn('❌ Reconnection failed:', error);
      return false;
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client ID
   */
  public getClientId(): string {
    return this.clientId;
  }

  /**
   * Check if background timer is supported
   */
  public isSupported(): boolean {
    return typeof fetch !== 'undefined';
  }

  /**
   * Cleanup on service shutdown
   */
  public cleanup(): void {
    this.stopHeartbeat();
    this.stopStatusChecking();
  }
}

// Create singleton instance
export const backgroundTimerClient = new BackgroundTimerClient();