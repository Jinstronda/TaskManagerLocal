import { EventEmitter } from 'events';
import { SessionRepository } from '../database/repositories/SessionRepository';
import { Session } from '../../shared/types';
import { logger } from '../utils/logger';

export interface BackgroundTimerState {
  sessionId: number;
  startTime: number;
  plannedDuration: number; // minutes
  sessionType: Session['sessionType'];
  isRunning: boolean;
  isPaused: boolean;
  pausedTime: number; // accumulated paused time in milliseconds
  lastActiveTime: number;
}

export class BackgroundTimerService extends EventEmitter {
  private activeTimers: Map<string, BackgroundTimerState> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 1000; // 1 second
  private readonly IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  private sessionRepository: SessionRepository;

  constructor(sessionRepository: SessionRepository) {
    super();
    this.sessionRepository = sessionRepository;
    this.startBackgroundCheck();
  }

  /**
   * Start a background timer for a session
   */
  public startTimer(clientId: string, session: Session): void {
    const timerState: BackgroundTimerState = {
      sessionId: session.id,
      startTime: Date.now(),
      plannedDuration: session.plannedDuration,
      sessionType: session.sessionType,
      isRunning: true,
      isPaused: false,
      pausedTime: 0,
      lastActiveTime: Date.now(),
    };

    this.activeTimers.set(clientId, timerState);
    logger.info(`Background timer started for session ${session.id} (client: ${clientId})`);
    
    this.emit('timerStarted', { clientId, session });
  }

  /**
   * Pause a background timer
   */
  public pauseTimer(clientId: string): void {
    const timer = this.activeTimers.get(clientId);
    if (!timer || !timer.isRunning || timer.isPaused) return;

    timer.isPaused = true;
    timer.lastActiveTime = Date.now();
    
    logger.info(`Background timer paused for session ${timer.sessionId} (client: ${clientId})`);
    this.emit('timerPaused', { clientId, sessionId: timer.sessionId });
  }

  /**
   * Resume a background timer
   */
  public resumeTimer(clientId: string): void {
    const timer = this.activeTimers.get(clientId);
    if (!timer || !timer.isRunning || !timer.isPaused) return;

    const pauseDuration = Date.now() - timer.lastActiveTime;
    timer.pausedTime += pauseDuration;
    timer.isPaused = false;
    timer.lastActiveTime = Date.now();
    
    logger.info(`Background timer resumed for session ${timer.sessionId} (client: ${clientId})`);
    this.emit('timerResumed', { clientId, sessionId: timer.sessionId });
  }

  /**
   * Stop a background timer
   */
  public stopTimer(clientId: string): void {
    const timer = this.activeTimers.get(clientId);
    if (!timer) return;

    const actualDuration = this.calculateActualDuration(timer);
    this.activeTimers.delete(clientId);
    
    logger.info(`Background timer stopped for session ${timer.sessionId} (client: ${clientId})`);
    this.emit('timerStopped', { 
      clientId, 
      sessionId: timer.sessionId, 
      actualDuration: Math.round(actualDuration / 60000) // convert to minutes
    });
  }

  /**
   * Complete a background timer
   */
  public async completeTimer(clientId: string, qualityRating?: number, notes?: string): Promise<void> {
    const timer = this.activeTimers.get(clientId);
    if (!timer) return;

    const actualDuration = this.calculateActualDuration(timer);
    const actualDurationMinutes = Math.round(actualDuration / 60000);

    try {
      // Update session in database
      await this.sessionRepository.update(timer.sessionId, {
        endTime: new Date(),
        actualDuration: actualDurationMinutes,
        qualityRating,
        notes,
        completed: true,
      });

      this.activeTimers.delete(clientId);
      
      logger.info(`Background timer completed for session ${timer.sessionId} (client: ${clientId})`);
      this.emit('timerCompleted', { 
        clientId, 
        sessionId: timer.sessionId, 
        actualDuration: actualDurationMinutes,
        qualityRating,
        notes
      });
    } catch (error) {
      logger.error(`Failed to complete session ${timer.sessionId}:`, error);
      this.emit('timerError', { clientId, sessionId: timer.sessionId, error });
    }
  }

  /**
   * Get timer state for a client
   */
  public getTimerState(clientId: string): BackgroundTimerState | null {
    return this.activeTimers.get(clientId) || null;
  }

  /**
   * Get remaining time for a timer
   */
  public getRemainingTime(clientId: string): number {
    const timer = this.activeTimers.get(clientId);
    if (!timer || !timer.isRunning) return 0;

    const elapsed = this.calculateElapsedTime(timer);
    const totalDuration = timer.plannedDuration * 60 * 1000; // convert to milliseconds
    return Math.max(0, totalDuration - elapsed);
  }

  /**
   * Update last active time for idle detection
   */
  public updateLastActiveTime(clientId: string): void {
    const timer = this.activeTimers.get(clientId);
    if (timer) {
      timer.lastActiveTime = Date.now();
    }
  }

  /**
   * Check if client is idle
   */
  public isClientIdle(clientId: string): boolean {
    const timer = this.activeTimers.get(clientId);
    if (!timer || timer.isPaused) return false;

    const timeSinceLastActive = Date.now() - timer.lastActiveTime;
    return timeSinceLastActive > this.IDLE_THRESHOLD;
  }

  /**
   * Get all active timers
   */
  public getActiveTimers(): Map<string, BackgroundTimerState> {
    return new Map(this.activeTimers);
  }

  /**
   * Clean up inactive timers
   */
  public cleanupInactiveTimers(): void {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

    for (const [clientId, timer] of this.activeTimers.entries()) {
      const timeSinceLastActive = now - timer.lastActiveTime;
      
      if (timeSinceLastActive > INACTIVE_THRESHOLD) {
        logger.warn(`Cleaning up inactive timer for client ${clientId} (session: ${timer.sessionId})`);
        this.stopTimer(clientId);
      }
    }
  }

  /**
   * Start background checking process
   */
  private startBackgroundCheck(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.performBackgroundChecks();
    }, this.CHECK_INTERVAL);

    logger.info('Background timer service started');
  }

  /**
   * Stop background checking process
   */
  public stopBackgroundCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Background timer service stopped');
    }
  }

  /**
   * Perform periodic background checks
   */
  private performBackgroundChecks(): void {
    for (const [clientId, timer] of this.activeTimers.entries()) {
      if (!timer.isRunning || timer.isPaused) continue;

      // Check if timer should auto-complete
      const remainingTime = this.getRemainingTime(clientId);
      if (remainingTime <= 0) {
        logger.info(`Auto-completing timer for session ${timer.sessionId} (client: ${clientId})`);
        this.completeTimer(clientId);
        continue;
      }

      // Check for idle clients
      if (this.isClientIdle(clientId)) {
        logger.info(`Client ${clientId} is idle, suggesting pause for session ${timer.sessionId}`);
        this.emit('clientIdle', { clientId, sessionId: timer.sessionId });
      }

      // Emit progress updates
      const progress = this.calculateProgress(timer);
      this.emit('timerProgress', { 
        clientId, 
        sessionId: timer.sessionId, 
        remainingTime: Math.round(remainingTime / 1000), // seconds
        progress 
      });
    }

    // Clean up inactive timers periodically
    if (Math.random() < 0.01) { // 1% chance each check (roughly every 100 seconds)
      this.cleanupInactiveTimers();
    }
  }

  /**
   * Calculate elapsed time for a timer
   */
  private calculateElapsedTime(timer: BackgroundTimerState): number {
    if (!timer.isRunning) return 0;

    const now = Date.now();
    const totalElapsed = now - timer.startTime;
    
    // Subtract paused time
    let pausedTime = timer.pausedTime;
    if (timer.isPaused) {
      pausedTime += now - timer.lastActiveTime;
    }

    return Math.max(0, totalElapsed - pausedTime);
  }

  /**
   * Calculate actual duration for a timer
   */
  private calculateActualDuration(timer: BackgroundTimerState): number {
    return this.calculateElapsedTime(timer);
  }

  /**
   * Calculate progress percentage for a timer
   */
  private calculateProgress(timer: BackgroundTimerState): number {
    const elapsed = this.calculateElapsedTime(timer);
    const totalDuration = timer.plannedDuration * 60 * 1000; // convert to milliseconds
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }

  /**
   * Cleanup on service shutdown
   */
  public async shutdown(): Promise<void> {
    this.stopBackgroundCheck();
    
    // Save state of active timers
    for (const [clientId, timer] of this.activeTimers.entries()) {
      try {
        const actualDuration = Math.round(this.calculateActualDuration(timer) / 60000);
        await this.sessionRepository.update(timer.sessionId, {
          endTime: new Date(),
          actualDuration,
          completed: false, // Mark as incomplete since it was interrupted
        });
        logger.info(`Saved timer state for session ${timer.sessionId} on shutdown`);
      } catch (error) {
        logger.error(`Failed to save timer state for session ${timer.sessionId}:`, error);
      }
    }

    this.activeTimers.clear();
    logger.info('Background timer service shutdown complete');
  }
}