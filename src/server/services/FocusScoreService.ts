import { DailyStatsRepository } from '../database/repositories/DailyStatsRepository';
import { SessionRepository } from '../database/repositories/SessionRepository';
import { UserSettingsRepository } from '../database/repositories/UserSettingsRepository';
import { StreakCalculationService } from './StreakCalculationService';
import { WeeklyGoalsService } from './WeeklyGoalsService';
import { DailyStats } from '../../shared/types';
import { logger } from '../utils/logger';

export interface FocusScoreBreakdown {
  date: string;
  totalScore: number;
  components: {
    timeScore: number;        // 0-40 points
    qualityScore: number;     // 0-30 points
    consistencyScore: number; // 0-20 points
    goalScore: number;        // 0-10 points
  };
  details: {
    totalFocusTime: number;
    sessionsCompleted: number;
    averageQuality: number;
    streakDay: boolean;
    goalProgress: number;
  };
}

export interface HabitChain {
  startDate: string;
  endDate: string;
  days: Array<{
    date: string;
    hasActivity: boolean;
    focusScore: number;
    streakDay: boolean;
    totalMinutes: number;
    isToday: boolean;
    isWeekend: boolean;
  }>;
  streakCount: number;
  totalDays: number;
  completionRate: number;
}

export interface Achievement {
  id: string;
  type: 'streak' | 'focus_score' | 'goal' | 'consistency' | 'milestone';
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
}

export interface HabitStatistics {
  currentStreak: number;
  longestStreak: number;
  averageFocusScore: number;
  totalFocusDays: number;
  totalFocusTime: number;
  averageDailyTime: number;
  bestDay: {
    date: string;
    focusScore: number;
    totalMinutes: number;
  } | null;
  weeklyConsistency: number; // percentage of weeks with at least 5 focus days
  monthlyTrend: Array<{
    month: string;
    averageScore: number;
    totalDays: number;
    totalMinutes: number;
  }>;
}

export class FocusScoreService {
  private dailyStatsRepository: DailyStatsRepository;
  private sessionRepository: SessionRepository;
  private userSettingsRepository: UserSettingsRepository;
  private streakService: StreakCalculationService;
  private weeklyGoalsService: WeeklyGoalsService;

  constructor() {
    this.dailyStatsRepository = new DailyStatsRepository();
    this.sessionRepository = new SessionRepository();
    this.userSettingsRepository = new UserSettingsRepository();
    this.streakService = new StreakCalculationService();
    this.weeklyGoalsService = new WeeklyGoalsService();
  }

  /**
   * Calculate comprehensive focus score for a specific date
   */
  public async calculateFocusScore(date: string): Promise<FocusScoreBreakdown> {
    try {
      // Get session data for the date
      const startDate = new Date(date + 'T00:00:00');
      const endDate = new Date(date + 'T23:59:59');
      const sessions = await this.sessionRepository.findByDateRange(startDate, endDate);
      const completedSessions = sessions.filter(session => session.completed);

      // Calculate basic metrics
      const totalFocusTime = completedSessions.reduce(
        (sum, session) => sum + (session.actualDuration || 0), 0
      );
      const sessionsCompleted = completedSessions.length;
      const averageQuality = completedSessions.length > 0
        ? completedSessions.reduce((sum, session) => sum + (session.qualityRating || 3), 0) / completedSessions.length
        : 0;

      // Time Score (0-40 points): Based on total focus time
      // 0-30min: 0-10pts, 30-60min: 10-20pts, 60-120min: 20-30pts, 120+min: 30-40pts
      let timeScore = 0;
      if (totalFocusTime >= 120) {
        timeScore = 30 + Math.min((totalFocusTime - 120) / 60 * 10, 10);
      } else if (totalFocusTime >= 60) {
        timeScore = 20 + (totalFocusTime - 60) / 60 * 10;
      } else if (totalFocusTime >= 30) {
        timeScore = 10 + (totalFocusTime - 30) / 30 * 10;
      } else {
        timeScore = totalFocusTime / 30 * 10;
      }

      // Quality Score (0-30 points): Based on session quality ratings
      const qualityScore = (averageQuality / 5) * 30;

      // Consistency Score (0-20 points): Based on streak status and session distribution
      const streakInfo = await this.streakService.calculateCurrentStreak();
      const streakDay = streakInfo.streakDates.includes(date);
      let consistencyScore = 0;
      
      if (streakDay) {
        consistencyScore += 10; // Base points for being a streak day
        
        // Bonus points for session distribution (better to have multiple sessions)
        if (sessionsCompleted >= 3) {
          consistencyScore += 10;
        } else if (sessionsCompleted >= 2) {
          consistencyScore += 5;
        }
      }

      // Goal Score (0-10 points): Based on weekly goal progress
      const weekDate = new Date(date);
      const weekProgress = await this.weeklyGoalsService.getWeekProgress(weekDate);
      const dayOfWeek = weekDate.getDay();
      const expectedProgress = ((dayOfWeek === 0 ? 7 : dayOfWeek) / 7) * 100; // Expected progress by this day
      const actualProgress = weekProgress.overallProgressPercentage;
      
      let goalScore = 0;
      if (actualProgress >= expectedProgress) {
        goalScore = 10;
      } else if (actualProgress >= expectedProgress * 0.8) {
        goalScore = 7;
      } else if (actualProgress >= expectedProgress * 0.6) {
        goalScore = 5;
      } else if (actualProgress >= expectedProgress * 0.4) {
        goalScore = 3;
      }

      const totalScore = Math.round(timeScore + qualityScore + consistencyScore + goalScore);

      return {
        date,
        totalScore: Math.min(totalScore, 100), // Cap at 100
        components: {
          timeScore: Math.round(timeScore),
          qualityScore: Math.round(qualityScore),
          consistencyScore: Math.round(consistencyScore),
          goalScore: Math.round(goalScore)
        },
        details: {
          totalFocusTime,
          sessionsCompleted,
          averageQuality,
          streakDay,
          goalProgress: actualProgress
        }
      };
    } catch (error) {
      logger.error('Error calculating focus score:', error);
      return {
        date,
        totalScore: 0,
        components: {
          timeScore: 0,
          qualityScore: 0,
          consistencyScore: 0,
          goalScore: 0
        },
        details: {
          totalFocusTime: 0,
          sessionsCompleted: 0,
          averageQuality: 0,
          streakDay: false,
          goalProgress: 0
        }
      };
    }
  }

  /**
   * Generate habit chain visualization for a date range
   */
  public async generateHabitChain(startDate: string, endDate: string): Promise<HabitChain> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date().toISOString().split('T')[0]!;
      
      const days = [];
      let streakCount = 0;
      let currentStreakActive = false;
      let totalDays = 0;
      let activeDays = 0;

      // Get all daily stats for the range
      const dailyStats = await this.dailyStatsRepository.findByDateRange(startDate, endDate);
      const statsMap = new Map(dailyStats.map(stat => [stat.date, stat]));

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]!;
        const stats = statsMap.get(dateStr);
        const isToday = dateStr === today;
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;

        const hasActivity = stats ? stats.totalFocusTime > 0 : false;
        const focusScore = stats ? stats.focusScore : 0;
        const streakDay = stats ? stats.streakDay : false;
        const totalMinutes = stats ? stats.totalFocusTime : 0;

        days.push({
          date: dateStr,
          hasActivity,
          focusScore,
          streakDay,
          totalMinutes,
          isToday,
          isWeekend
        });

        totalDays++;
        if (hasActivity) {
          activeDays++;
          if (streakDay) {
            if (!currentStreakActive) {
              streakCount++;
              currentStreakActive = true;
            }
          } else {
            currentStreakActive = false;
          }
        } else {
          currentStreakActive = false;
        }
      }

      const completionRate = totalDays > 0 ? (activeDays / totalDays) * 100 : 0;

      return {
        startDate,
        endDate,
        days,
        streakCount,
        totalDays,
        completionRate
      };
    } catch (error) {
      logger.error('Error generating habit chain:', error);
      return {
        startDate,
        endDate,
        days: [],
        streakCount: 0,
        totalDays: 0,
        completionRate: 0
      };
    }
  }

  /**
   * Get comprehensive habit statistics
   */
  public async getHabitStatistics(days: number = 90): Promise<HabitStatistics> {
    try {
      const endDate = new Date().toISOString().split('T')[0]!;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0]!;

      // Get streak information
      const streakInfo = await this.streakService.calculateCurrentStreak();
      
      // Get daily stats
      const dailyStats = await this.dailyStatsRepository.findByDateRange(startDateStr, endDate);
      const focusDays = dailyStats.filter(day => day.totalFocusTime > 0);

      // Calculate basic metrics
      const totalFocusDays = focusDays.length;
      const totalFocusTime = dailyStats.reduce((sum, day) => sum + day.totalFocusTime, 0);
      const averageFocusScore = dailyStats.length > 0
        ? dailyStats.reduce((sum, day) => sum + day.focusScore, 0) / dailyStats.length
        : 0;
      const averageDailyTime = totalFocusDays > 0 ? totalFocusTime / totalFocusDays : 0;

      // Find best day
      const bestDay = dailyStats.reduce((best, current) => {
        if (!best || current.focusScore > best.focusScore) {
          return {
            date: current.date,
            focusScore: current.focusScore,
            totalMinutes: current.totalFocusTime
          };
        }
        return best;
      }, null as { date: string; focusScore: number; totalMinutes: number } | null);

      // Calculate weekly consistency
      const weeks = Math.ceil(days / 7);
      let consistentWeeks = 0;
      
      for (let week = 0; week < weeks; week++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + (week * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekStats = dailyStats.filter(day => {
          const dayDate = new Date(day.date);
          return dayDate >= weekStart && dayDate <= weekEnd;
        });
        
        const weekFocusDays = weekStats.filter(day => day.totalFocusTime > 0).length;
        if (weekFocusDays >= 5) {
          consistentWeeks++;
        }
      }
      
      const weeklyConsistency = weeks > 0 ? (consistentWeeks / weeks) * 100 : 0;

      // Calculate monthly trends
      const monthlyTrend = [];
      const monthsToShow = Math.min(6, Math.ceil(days / 30));
      
      for (let month = 0; month < monthsToShow; month++) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - month);
        monthStart.setDate(1);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        
        const monthStartStr = monthStart.toISOString().split('T')[0]!;
        const monthEndStr = monthEnd.toISOString().split('T')[0]!;
        
        const monthStats = dailyStats.filter(day => day.date >= monthStartStr && day.date <= monthEndStr);
        
        if (monthStats.length > 0) {
          const averageScore = monthStats.reduce((sum, day) => sum + day.focusScore, 0) / monthStats.length;
          const totalDays = monthStats.filter(day => day.totalFocusTime > 0).length;
          const totalMinutes = monthStats.reduce((sum, day) => sum + day.totalFocusTime, 0);
          
          monthlyTrend.unshift({
            month: monthStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
            averageScore,
            totalDays,
            totalMinutes
          });
        }
      }

      return {
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
        averageFocusScore,
        totalFocusDays,
        totalFocusTime,
        averageDailyTime,
        bestDay,
        weeklyConsistency,
        monthlyTrend
      };
    } catch (error) {
      logger.error('Error getting habit statistics:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        averageFocusScore: 0,
        totalFocusDays: 0,
        totalFocusTime: 0,
        averageDailyTime: 0,
        bestDay: null,
        weeklyConsistency: 0,
        monthlyTrend: []
      };
    }
  }

  /**
   * Generate achievements based on user activity
   */
  public async generateAchievements(): Promise<Achievement[]> {
    try {
      const achievements: Achievement[] = [];
      const stats = await this.getHabitStatistics(365); // Look at full year
      const streakInfo = await this.streakService.calculateCurrentStreak();

      // Streak achievements
      const streakMilestones = [
        { days: 7, title: 'Week Warrior', rarity: 'common' as const },
        { days: 14, title: 'Fortnight Fighter', rarity: 'common' as const },
        { days: 30, title: 'Monthly Master', rarity: 'rare' as const },
        { days: 50, title: 'Consistency Champion', rarity: 'rare' as const },
        { days: 100, title: 'Century Achiever', rarity: 'epic' as const },
        { days: 365, title: 'Year-Long Legend', rarity: 'legendary' as const }
      ];

      for (const milestone of streakMilestones) {
        if (stats.longestStreak >= milestone.days) {
          achievements.push({
            id: `streak_${milestone.days}`,
            type: 'streak',
            title: milestone.title,
            description: `Maintained a ${milestone.days}-day focus streak`,
            icon: '🔥',
            earnedAt: new Date(),
            value: milestone.days,
            rarity: milestone.rarity
          });
        }
      }

      // Focus score achievements
      if (stats.averageFocusScore >= 90) {
        achievements.push({
          id: 'focus_master',
          type: 'focus_score',
          title: 'Focus Master',
          description: 'Achieved 90+ average focus score',
          icon: '🎯',
          earnedAt: new Date(),
          value: Math.round(stats.averageFocusScore),
          rarity: 'epic'
        });
      } else if (stats.averageFocusScore >= 75) {
        achievements.push({
          id: 'focus_expert',
          type: 'focus_score',
          title: 'Focus Expert',
          description: 'Achieved 75+ average focus score',
          icon: '🎯',
          earnedAt: new Date(),
          value: Math.round(stats.averageFocusScore),
          rarity: 'rare'
        });
      }

      // Time-based achievements
      const timeMilestones = [
        { hours: 10, title: 'Getting Started', rarity: 'common' as const },
        { hours: 50, title: 'Dedicated Learner', rarity: 'common' as const },
        { hours: 100, title: 'Century Club', rarity: 'rare' as const },
        { hours: 500, title: 'Time Master', rarity: 'epic' as const },
        { hours: 1000, title: 'Millennium Achiever', rarity: 'legendary' as const }
      ];

      const totalHours = stats.totalFocusTime / 60;
      for (const milestone of timeMilestones) {
        if (totalHours >= milestone.hours) {
          achievements.push({
            id: `time_${milestone.hours}`,
            type: 'milestone',
            title: milestone.title,
            description: `Completed ${milestone.hours} hours of focused work`,
            icon: '⏰',
            earnedAt: new Date(),
            value: milestone.hours,
            rarity: milestone.rarity
          });
        }
      }

      // Consistency achievements
      if (stats.weeklyConsistency >= 90) {
        achievements.push({
          id: 'consistency_master',
          type: 'consistency',
          title: 'Consistency Master',
          description: 'Maintained 90%+ weekly consistency',
          icon: '📈',
          earnedAt: new Date(),
          value: Math.round(stats.weeklyConsistency),
          rarity: 'epic'
        });
      } else if (stats.weeklyConsistency >= 75) {
        achievements.push({
          id: 'consistency_champion',
          type: 'consistency',
          title: 'Consistency Champion',
          description: 'Maintained 75%+ weekly consistency',
          icon: '📈',
          earnedAt: new Date(),
          value: Math.round(stats.weeklyConsistency),
          rarity: 'rare'
        });
      }

      // Sort by rarity and value
      const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
      achievements.sort((a, b) => {
        const rarityDiff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
        if (rarityDiff !== 0) return rarityDiff;
        return b.value - a.value;
      });

      return achievements;
    } catch (error) {
      logger.error('Error generating achievements:', error);
      return [];
    }
  }

  /**
   * Get focus score trends for visualization
   */
  public async getFocusScoreTrends(days: number = 30): Promise<Array<{
    date: string;
    focusScore: number;
    components: {
      timeScore: number;
      qualityScore: number;
      consistencyScore: number;
      goalScore: number;
    };
    totalMinutes: number;
    sessionsCompleted: number;
  }>> {
    try {
      const endDate = new Date().toISOString().split('T')[0]!;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0]!;

      const trends = [];
      
      for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]!;
        if (dateStr) {
          const scoreBreakdown = await this.calculateFocusScore(dateStr);
          
          trends.push({
            date: dateStr,
            focusScore: scoreBreakdown.totalScore,
            components: scoreBreakdown.components,
            totalMinutes: scoreBreakdown.details.totalFocusTime,
            sessionsCompleted: scoreBreakdown.details.sessionsCompleted
          });
        }
      }

      return trends;
    } catch (error) {
      logger.error('Error getting focus score trends:', error);
      return [];
    }
  }

  /**
   * Update focus scores for all dates with session data
   */
  public async updateAllFocusScores(): Promise<void> {
    try {
      // Get all dates with session data
      const sessions = await this.sessionRepository.findAll();
      const uniqueDates = [...new Set(sessions.map(session => 
        session.startTime.toISOString().split('T')[0]!
      ))];

      for (const date of uniqueDates) {
        if (date) {
          const scoreBreakdown = await this.calculateFocusScore(date);
          
          // Update the daily stats with the calculated focus score
          await this.dailyStatsRepository.updateFocusScore(date, scoreBreakdown.totalScore);
        }
      }

      logger.info(`Updated focus scores for ${uniqueDates.length} dates`);
    } catch (error) {
      logger.error('Error updating all focus scores:', error);
      throw error;
    }
  }
}