import { useTimerStore } from '../stores/timerStore';

export class TimerService {
  private intervalId: number | null = null;
  private readonly TICK_INTERVAL = 100; // 100ms for smooth updates
  private readonly SLEEP_DETECTION_THRESHOLD = 2000; // 2 seconds
  private lastTickTime: number = 0;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;
    
    this.setupVisibilityChangeListener();
    this.setupBeforeUnloadListener();
    this.setupFocusListeners();
    this.requestNotificationPermission();
    
    this.isInitialized = true;
  }

  /**
   * Start the timer service
   */
  public start(): void {
    if (this.intervalId !== null) {
      this.stop();
    }

    this.lastTickTime = Date.now();
    this.intervalId = window.setInterval(() => {
      this.tick();
    }, this.TICK_INTERVAL);
  }

  /**
   * Stop the timer service
   */
  public stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Main tick function that updates the timer and detects system sleep
   */
  private tick(): void {
    const now = Date.now();
    const deltaTime = now - this.lastTickTime;

    // Detect system sleep or significant lag
    if (deltaTime > this.SLEEP_DETECTION_THRESHOLD) {
      this.handleSystemSleepDetection(deltaTime);
    }

    // Update the timer store
    useTimerStore.getState().tick();
    useTimerStore.getState().updateLastActiveTime();
    
    this.lastTickTime = now;
  }

  /**
   * Handle system sleep detection
   */
  private handleSystemSleepDetection(deltaTime: number): void {
    const timerStore = useTimerStore.getState();
    
    if (timerStore.isRunning && !timerStore.isPaused) {
      console.warn(`System sleep detected. Time gap: ${deltaTime}ms`);
      
      // Pause the timer and mark sleep detection
      timerStore.detectSystemSleep();
      
      // Show notification about sleep detection
      this.showSleepDetectionNotification(Math.round(deltaTime / 1000));
    }
  }

  /**
   * Show notification when system sleep is detected
   */
  private showSleepDetectionNotification(secondsGap: number): void {
    const timerStore = useTimerStore.getState();
    
    if (!timerStore.sessionPreferences.notificationsEnabled) return;

    const message = `System sleep detected (${secondsGap}s gap). Timer has been paused.`;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Paused - Sleep Detected', {
        body: message,
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    }
  }

  /**
   * Setup visibility change listener to detect when app is minimized/hidden
   */
  private setupVisibilityChangeListener(): void {
    document.addEventListener('visibilitychange', () => {
      const timerStore = useTimerStore.getState();
      
      if (document.hidden) {
        // App is hidden/minimized
        console.log('App minimized, continuing timer in background');
        timerStore.updateLastActiveTime();
      } else {
        // App is visible again
        console.log('App restored from background');
        timerStore.updateLastActiveTime();
        timerStore.detectSystemSleep();
      }
    });
  }

  /**
   * Setup beforeunload listener to save timer state
   */
  private setupBeforeUnloadListener(): void {
    window.addEventListener('beforeunload', () => {
      const timerStore = useTimerStore.getState();
      
      if (timerStore.isRunning) {
        // Save current timer state to localStorage for recovery
        const timerState = {
          isRunning: timerStore.isRunning,
          isPaused: timerStore.isPaused,
          remainingTime: timerStore.remainingTime,
          sessionType: timerStore.sessionType,
          plannedDuration: timerStore.plannedDuration,
          startTime: timerStore.startTime,
          pausedTime: timerStore.pausedTime,
          currentSession: timerStore.currentSession,
          lastActiveTime: Date.now(),
        };
        
        localStorage.setItem('timerState', JSON.stringify(timerState));
      }
    });
  }

  /**
   * Setup focus/blur listeners for idle detection
   */
  private setupFocusListeners(): void {
    let idleTimer: number | null = null;
    const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    const resetIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
      
      idleTimer = window.setTimeout(() => {
        this.handleIdleDetection();
      }, IDLE_THRESHOLD);
      
      useTimerStore.getState().updateLastActiveTime();
    };

    // Reset idle timer on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Initial setup
    resetIdleTimer();
  }

  /**
   * Handle idle detection
   */
  private handleIdleDetection(): void {
    const timerStore = useTimerStore.getState();
    
    if (timerStore.isRunning && !timerStore.isPaused) {
      console.log('User idle detected during active session');
      
      // Show idle notification
      this.showIdleNotification();
    }
  }

  /**
   * Show notification when user is idle during active session
   */
  private showIdleNotification(): void {
    const timerStore = useTimerStore.getState();
    
    if (!timerStore.sessionPreferences.notificationsEnabled) return;

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Are you still there?', {
        body: 'You seem to be away. Would you like to pause the timer?',
        icon: '/favicon.ico',
        requireInteraction: true,
      });

      notification.onclick = () => {
        // Focus the app window
        window.focus();
        notification.close();
      };
    }
  }

  /**
   * Request notification permission
   */
  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  /**
   * Recover timer state from localStorage (called on app startup)
   */
  public recoverTimerState(): boolean {
    try {
      const savedState = localStorage.getItem('timerState');
      if (!savedState) return false;

      const timerState = JSON.parse(savedState);
      const now = Date.now();
      const timeSinceLastActive = now - timerState.lastActiveTime;

      // If more than 10 minutes have passed, don't recover
      if (timeSinceLastActive > 10 * 60 * 1000) {
        localStorage.removeItem('timerState');
        return false;
      }

      const timerStore = useTimerStore.getState();
      
      // Calculate how much time should have passed
      const timePassedSeconds = Math.floor(timeSinceLastActive / 1000);
      const newRemainingTime = Math.max(0, timerState.remainingTime - timePassedSeconds);

      // Restore timer state
      timerStore.startTimer(
        timerState.sessionType,
        timerState.plannedDuration,
        timerState.currentSession?.taskId,
        timerState.currentSession?.categoryId
      );

      // Update with recovered values
      useTimerStore.setState({
        remainingTime: newRemainingTime,
        isPaused: timerState.isPaused || timeSinceLastActive > 2000, // Auto-pause if significant time passed
        currentSession: timerState.currentSession,
        isSystemSleepDetected: timeSinceLastActive > 2000,
      });

      // Clean up
      localStorage.removeItem('timerState');
      
      console.log(`Timer state recovered. Time passed: ${timePassedSeconds}s, Remaining: ${newRemainingTime}s`);
      return true;
    } catch (error) {
      console.error('Failed to recover timer state:', error);
      localStorage.removeItem('timerState');
      return false;
    }
  }

  /**
   * Get accurate current time for timer calculations
   */
  public getCurrentTime(): number {
    return Date.now();
  }

  /**
   * Format time in seconds to MM:SS or HH:MM:SS format
   */
  public formatTime(seconds: number, showHours: boolean = false): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (showHours) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    // If more than 60 minutes, show total minutes (not hours)
    const totalMinutes = Math.floor(seconds / 60);
    return `${totalMinutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate session progress percentage
   */
  public getSessionProgress(remainingTime: number, plannedDuration: number): number {
    const totalSeconds = plannedDuration * 60;
    const elapsedSeconds = totalSeconds - remainingTime;
    return Math.min(100, Math.max(0, (elapsedSeconds / totalSeconds) * 100));
  }

  /**
   * Get session type display name
   */
  public getSessionTypeDisplayName(sessionType: string): string {
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
   * Get session type color for UI
   */
  public getSessionTypeColor(sessionType: string): string {
    switch (sessionType) {
      case 'deep_work':
        return '#3B82F6'; // blue
      case 'quick_task':
        return '#10B981'; // green
      case 'break':
        return '#F59E0B'; // amber
      case 'custom':
        return '#8B5CF6'; // purple
      default:
        return '#6B7280'; // gray
    }
  }
}

// Create singleton instance
export const timerService = new TimerService();