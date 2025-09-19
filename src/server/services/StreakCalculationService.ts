import { DailyStatsRepository } from '../database/repositories/DailyStatsRepository';
import { SessionRepository } from '../database/repositories/SessionRepository';
import { UserSettingsRepository } from '../database/repositories/UserSettingsRepository';
import { DailyStats } from '../../shared/types';
import { logger } from '../utils/logger';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  streakDates: string[];
  lastStreakDate?: string | undefined;
  gracePeriodActive: boolean;
  gracePeriodEndsAt?: Date | undefined;
}

export interface StreakSettings {
  minimumFocusTime: number; // minutes required for a streak day
  gracePeriodDays: number; // days allowed to miss before breaking streak
  streakRecoveryEnabled: boolean;
}

export class StreakCalculationService {
  private dailyStatsRepository: DailyStatsRepository;
  private sessionRepository: SessionRepository;
  private userSettingsRepository: UserSettingsRepository;

  constructor() {
    this.dailyStatsRepository = new DailyStatsRepository();
    this.sessionRepository = new SessionRepository();
    this.userSettingsRepository = new UserSettingsRepository();
  }

  /**
   * Get default streak settings
   */
  private getDefaultStreakSettings(): StreakSettings {
    return {
      minimumFocusTime: 25, // 25 minutes minimum for a streak day
      gracePeriodDays: 1, // 1 day grace period
      streakRecoveryEnabled: true
    };
  }

  /**
   * Get user's streak settings
   */
  private async getStreakSettings(): Promise<StreakSettings> {
    try {
      const settings = await this.userSettingsRepository.getMultiple([
        'streak_minimum_focus_time',
        'streak_grace_period_days',
        'streak_recovery_enabled'
      ]);

      return {
        minimumFocusTime: parseInt(settings.streak_minimum_focus_time || '25'),
        gracePeriodDays: parseInt(settings.streak_grace_period_days || '1'),
        streakRecoveryEnabled: settings.streak_recovery_enabled !== 'false'
      };
    } catch (error) {
      logger.warn('Failed to load streak settings, using defaults:', error);
      return this.getDefaultStreakSettings();
    }
  }

  /**
   * Calculate if a date qualifies as a streak day based on focus time
   */
  public async calculateStreakDay(date: string): Promise<boolean> {
    try {
      const settings = await this.getStreakSettings();
      
      // Get total focus time for the date from completed sessions
      const sessions = await this.sessionRepository.findByDateRange(
        new Date(date + 'T00:00:00'),
        new Date(date + 'T23:59:59')
      );

      const completedSessions = sessions.filter(session => session.completed);
      const totalFocusTime = completedSessions.reduce(
        (total, session) => total + (session.actualDuration || 0),
        0
      );

      return totalFocusTime >= settings.minimumFocusTime;
    } catch (error) {
      logger.error('Error calculating streak day:', error);
      return false;
    }
  }

  /**
   * Update daily stats and recalculate streak status
   */
  public async updateDailyStats(date: string): Promise<DailyStats> {
    try {
      // Calculate if this day qualifies as a streak day
      const isStreakDay = await this.calculateStreakDay(date);
      
      // Update daily stats with streak information
      const updatedStats = await this.dailyStatsRepository.calculateAndUpdateFromSessions(date);
      
      // Update streak day status if different
      if (updatedStats.streakDay !== isStreakDay) {
        await this.dailyStatsRepository.markStreakDay(date, isStreakDay);
        updatedStats.streakDay = isStreakDay;
      }

      logger.info(`Updated daily stats for ${date}: streak day = ${isStreakDay}`);
      return updatedStats;
    } catch (error) {
      logger.error('Error updating daily stats:', error);
      throw error;
    }
  }

  /**
   * Calculate current streak with grace period handling
   */
  public async calculateCurrentStreak(): Promise<StreakInfo> {
    try {
      const settings = await this.getStreakSettings();
      const today = new Date().toISOString().split('T')[0]!;
      
      // Get all streak days from the database
      const streakData = await this.dailyStatsRepository.getCurrentStreak();
      
      // Calculate current streak with grace period
      let currentStreak = 0;
      let gracePeriodActive = false;
      let gracePeriodEndsAt: Date | undefined;
      let lastStreakDate: string | undefined;
      
      const checkDate = new Date(today);
      let consecutiveMissedDays = 0;
      
      // Check backwards from today
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0]!;
        
        const hasStreakDay = streakData.streakDates.includes(dateStr);
        
        if (hasStreakDay) {
          currentStreak++;
          lastStreakDate = dateStr;
          consecutiveMissedDays = 0; // Reset missed days counter
        } else {
          consecutiveMissedDays++;
          
          // Check if we're within grace period
          if (consecutiveMissedDays <= settings.gracePeriodDays && currentStreak > 0) {
            gracePeriodActive = true;
            if (!gracePeriodEndsAt) {
              gracePeriodEndsAt = new Date(checkDate.getTime());
              gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + settings.gracePeriodDays - consecutiveMissedDays + 1);
            }
          } else {
            // Grace period exceeded or no streak to maintain
            break;
          }
        }
        
        checkDate.setDate(checkDate.getDate() - 1);
        
        // Prevent infinite loop - don't check more than 365 days back
        if (checkDate < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
          break;
        }
      }

      return {
        currentStreak,
        longestStreak: streakData.longestStreak,
        streakDates: streakData.streakDates,
        lastStreakDate: lastStreakDate || undefined,
        gracePeriodActive,
        gracePeriodEndsAt: gracePeriodEndsAt || undefined
      };
    } catch (error) {
      logger.error('Error calculating current streak:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakDates: [],
        gracePeriodActive: false
      };
    }
  }

  /**
   * Attempt to recover a broken streak within grace period
   */
  public async recoverStreak(date: string): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await this.getStreakSettings();
      
      if (!settings.streakRecoveryEnabled) {
        return { success: false, message: 'Streak recovery is disabled' };
      }

      const streakInfo = await this.calculateCurrentStreak();
      
      if (!streakInfo.gracePeriodActive) {
        return { success: false, message: 'No active grace period for streak recovery' };
      }

      // Check if the date qualifies for streak recovery
      const isStreakDay = await this.calculateStreakDay(date);
      
      if (!isStreakDay) {
        return { 
          success: false, 
          message: `Date ${date} does not meet minimum focus time requirement (${settings.minimumFocusTime} minutes)` 
        };
      }

      // Mark the date as a streak day
      await this.dailyStatsRepository.markStreakDay(date, true);
      
      logger.info(`Streak recovered for date ${date}`);
      return { success: true, message: `Streak successfully recovered for ${date}` };
    } catch (error) {
      logger.error('Error recovering streak:', error);
      return { success: false, message: 'Failed to recover streak due to system error' };
    }
  }

  /**
   * Get streak statistics for a date range
   */
  public async getStreakStatistics(startDate: string, endDate: string): Promise<{
    totalStreakDays: number;
    streakPercentage: number;
    averageFocusTime: number;
    longestStreakInPeriod: number;
    streakDays: string[];
  }> {
    try {
      const dailyStats = await this.dailyStatsRepository.findByDateRange(startDate, endDate);
      
      const streakDays = dailyStats.filter(day => day.streakDay).map(day => day.date);
      const totalDays = dailyStats.length;
      const totalStreakDays = streakDays.length;
      const streakPercentage = totalDays > 0 ? (totalStreakDays / totalDays) * 100 : 0;
      
      const averageFocusTime = totalDays > 0 
        ? dailyStats.reduce((sum, day) => sum + day.totalFocusTime, 0) / totalDays 
        : 0;

      // Calculate longest streak in the period
      let longestStreakInPeriod = 0;
      let currentStreakInPeriod = 0;
      
      for (const day of dailyStats) {
        if (day.streakDay) {
          currentStreakInPeriod++;
          longestStreakInPeriod = Math.max(longestStreakInPeriod, currentStreakInPeriod);
        } else {
          currentStreakInPeriod = 0;
        }
      }

      return {
        totalStreakDays,
        streakPercentage,
        averageFocusTime,
        longestStreakInPeriod,
        streakDays
      };
    } catch (error) {
      logger.error('Error getting streak statistics:', error);
      return {
        totalStreakDays: 0,
        streakPercentage: 0,
        averageFocusTime: 0,
        longestStreakInPeriod: 0,
        streakDays: []
      };
    }
  }

  /**
   * Update streak settings
   */
  public async updateStreakSettings(settings: Partial<StreakSettings>): Promise<void> {
    try {
      const updates: Record<string, string> = {};
      
      if (settings.minimumFocusTime !== undefined) {
        updates.streak_minimum_focus_time = settings.minimumFocusTime.toString();
      }
      
      if (settings.gracePeriodDays !== undefined) {
        updates.streak_grace_period_days = settings.gracePeriodDays.toString();
      }
      
      if (settings.streakRecoveryEnabled !== undefined) {
        updates.streak_recovery_enabled = settings.streakRecoveryEnabled.toString();
      }

      await this.userSettingsRepository.setMultiple(updates);
      logger.info('Streak settings updated:', settings);
    } catch (error) {
      logger.error('Error updating streak settings:', error);
      throw error;
    }
  }

  /**
   * Get upcoming streak milestones
   */
  public async getUpcomingMilestones(): Promise<Array<{
    milestone: number;
    daysToGo: number;
    description: string;
  }>> {
    try {
      const streakInfo = await this.calculateCurrentStreak();
      const currentStreak = streakInfo.currentStreak;
      
      const milestones = [7, 14, 30, 50, 100, 200, 365];
      const upcomingMilestones = milestones
        .filter(milestone => milestone > currentStreak)
        .slice(0, 3) // Show next 3 milestones
        .map(milestone => ({
          milestone,
          daysToGo: milestone - currentStreak,
          description: this.getMilestoneDescription(milestone)
        }));

      return upcomingMilestones;
    } catch (error) {
      logger.error('Error getting upcoming milestones:', error);
      return [];
    }
  }

  /**
   * Get description for streak milestones
   */
  private getMilestoneDescription(milestone: number): string {
    const descriptions: Record<number, string> = {
      7: 'One Week Warrior',
      14: 'Two Week Champion',
      30: 'Monthly Master',
      50: 'Focus Fighter',
      100: 'Century Achiever',
      200: 'Consistency King',
      365: 'Year-Long Legend'
    };

    return descriptions[milestone] || `${milestone} Day Streak`;
  }
}