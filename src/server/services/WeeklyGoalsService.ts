import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { DailyStatsRepository } from '../database/repositories/DailyStatsRepository';
import { SessionRepository } from '../database/repositories/SessionRepository';
import { UserSettingsRepository } from '../database/repositories/UserSettingsRepository';
import { Category } from '../../shared/types';
import { logger } from '../utils/logger';

export interface WeeklyGoal {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  targetMinutes: number;
  currentMinutes: number;
  progressPercentage: number;
  isCompleted: boolean;
  weekStart: string; // YYYY-MM-DD format
  weekEnd: string;   // YYYY-MM-DD format
}

export interface WeeklyGoalProgress {
  weekStart: string;
  weekEnd: string;
  totalTargetMinutes: number;
  totalCurrentMinutes: number;
  overallProgressPercentage: number;
  completedGoals: number;
  totalGoals: number;
  goals: WeeklyGoal[];
  dailyBreakdown: Array<{
    date: string;
    totalMinutes: number;
    categoryBreakdown: Array<{
      categoryId: number;
      categoryName: string;
      minutes: number;
    }>;
  }>;
}

export interface GoalAchievement {
  categoryId: number;
  categoryName: string;
  weekStart: string;
  achievedAt: Date;
  targetMinutes: number;
  actualMinutes: number;
  overachievementPercentage: number;
}

export class WeeklyGoalsService {
  private categoryRepository: CategoryRepository;
  private dailyStatsRepository: DailyStatsRepository;
  private sessionRepository: SessionRepository;
  private userSettingsRepository: UserSettingsRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
    this.dailyStatsRepository = new DailyStatsRepository();
    this.sessionRepository = new SessionRepository();
    this.userSettingsRepository = new UserSettingsRepository();
  }

  /**
   * Get the start of the week (Monday) for a given date
   */
  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return d.toISOString().split('T')[0]!;
  }

  /**
   * Get the end of the week (Sunday) for a given date
   */
  private getWeekEnd(date: Date): string {
    const weekStart = new Date(this.getWeekStart(date));
    weekStart.setDate(weekStart.getDate() + 6);
    return weekStart.toISOString().split('T')[0]!;
  }

  /**
   * Update weekly goal for a category
   */
  public async updateCategoryWeeklyGoal(categoryId: number, targetMinutes: number): Promise<void> {
    try {
      // Update the category's weekly goal
      await this.categoryRepository.update(categoryId, { weeklyGoal: targetMinutes });
      
      logger.info(`Updated weekly goal for category ${categoryId}: ${targetMinutes} minutes`);
    } catch (error) {
      logger.error('Error updating category weekly goal:', error);
      throw error;
    }
  }

  /**
   * Get current week's goals and progress
   */
  public async getCurrentWeekProgress(): Promise<WeeklyGoalProgress> {
    const today = new Date();
    return this.getWeekProgress(today);
  }

  /**
   * Get weekly goals and progress for a specific week
   */
  public async getWeekProgress(date: Date): Promise<WeeklyGoalProgress> {
    try {
      const weekStart = this.getWeekStart(date);
      const weekEnd = this.getWeekEnd(date);

      // Get all categories with weekly goals
      const categories = await this.categoryRepository.findAll();
      const categoriesWithGoals = categories.filter(cat => cat.weeklyGoal > 0);

      // Get session data for the week
      const weekStartDate = new Date(weekStart + 'T00:00:00');
      const weekEndDate = new Date(weekEnd + 'T23:59:59');
      const sessions = await this.sessionRepository.findByDateRange(weekStartDate, weekEndDate);
      const completedSessions = sessions.filter(session => session.completed);

      // Calculate progress for each category
      const goals: WeeklyGoal[] = [];
      let totalTargetMinutes = 0;
      let totalCurrentMinutes = 0;
      let completedGoals = 0;

      for (const category of categoriesWithGoals) {
        const categoryMinutes = completedSessions
          .filter(session => session.categoryId === category.id)
          .reduce((sum, session) => sum + (session.actualDuration || 0), 0);

        const progressPercentage = category.weeklyGoal > 0 
          ? Math.min((categoryMinutes / category.weeklyGoal) * 100, 100)
          : 0;

        const isCompleted = categoryMinutes >= category.weeklyGoal;
        if (isCompleted) completedGoals++;

        goals.push({
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color,
          targetMinutes: category.weeklyGoal,
          currentMinutes: categoryMinutes,
          progressPercentage,
          isCompleted,
          weekStart,
          weekEnd
        });

        totalTargetMinutes += category.weeklyGoal;
        totalCurrentMinutes += categoryMinutes;
      }

      const overallProgressPercentage = totalTargetMinutes > 0 
        ? Math.min((totalCurrentMinutes / totalTargetMinutes) * 100, 100)
        : 0;

      // Get daily breakdown
      const dailyBreakdown = await this.getDailyBreakdown(weekStart, weekEnd, categoriesWithGoals);

      return {
        weekStart,
        weekEnd,
        totalTargetMinutes,
        totalCurrentMinutes,
        overallProgressPercentage,
        completedGoals,
        totalGoals: categoriesWithGoals.length,
        goals,
        dailyBreakdown
      };
    } catch (error) {
      logger.error('Error getting week progress:', error);
      throw error;
    }
  }

  /**
   * Get daily breakdown for the week
   */
  private async getDailyBreakdown(
    weekStart: string, 
    weekEnd: string, 
    categories: Category[]
  ): Promise<Array<{
    date: string;
    totalMinutes: number;
    categoryBreakdown: Array<{
      categoryId: number;
      categoryName: string;
      minutes: number;
    }>;
  }>> {
    const breakdown = [];
    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]!;
      const dayStart = new Date(dateStr + 'T00:00:00');
      const dayEnd = new Date(dateStr + 'T23:59:59');

      const daySessions = await this.sessionRepository.findByDateRange(dayStart, dayEnd);
      const completedDaySessions = daySessions.filter(session => session.completed);

      const categoryBreakdown = categories.map(category => {
        const categoryMinutes = completedDaySessions
          .filter(session => session.categoryId === category.id)
          .reduce((sum, session) => sum + (session.actualDuration || 0), 0);

        return {
          categoryId: category.id,
          categoryName: category.name,
          minutes: categoryMinutes
        };
      });

      const totalMinutes = categoryBreakdown.reduce((sum, cat) => sum + cat.minutes, 0);

      breakdown.push({
        date: dateStr,
        totalMinutes,
        categoryBreakdown
      });
    }

    return breakdown;
  }

  /**
   * Get goal achievements for a date range
   */
  public async getGoalAchievements(startDate: string, endDate: string): Promise<GoalAchievement[]> {
    try {
      const achievements: GoalAchievement[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Iterate through each week in the date range
      for (let weekStart = new Date(start); weekStart <= end; weekStart.setDate(weekStart.getDate() + 7)) {
        const weekProgress = await this.getWeekProgress(weekStart);
        
        for (const goal of weekProgress.goals) {
          if (goal.isCompleted) {
            const overachievementPercentage = goal.targetMinutes > 0 
              ? ((goal.currentMinutes - goal.targetMinutes) / goal.targetMinutes) * 100
              : 0;

            achievements.push({
              categoryId: goal.categoryId,
              categoryName: goal.categoryName,
              weekStart: goal.weekStart,
              achievedAt: new Date(goal.weekEnd + 'T23:59:59'),
              targetMinutes: goal.targetMinutes,
              actualMinutes: goal.currentMinutes,
              overachievementPercentage: Math.max(0, overachievementPercentage)
            });
          }
        }
      }

      return achievements.sort((a, b) => b.achievedAt.getTime() - a.achievedAt.getTime());
    } catch (error) {
      logger.error('Error getting goal achievements:', error);
      return [];
    }
  }

  /**
   * Get weekly goal statistics
   */
  public async getWeeklyGoalStatistics(weeks: number = 12): Promise<{
    averageCompletionRate: number;
    totalGoalsSet: number;
    totalGoalsAchieved: number;
    bestWeek: {
      weekStart: string;
      completionRate: number;
      totalMinutes: number;
    } | null;
    categoryPerformance: Array<{
      categoryId: number;
      categoryName: string;
      averageCompletion: number;
      weeksWithGoals: number;
      weeksCompleted: number;
    }>;
    weeklyTrend: Array<{
      weekStart: string;
      completionRate: number;
      totalMinutes: number;
      goalsCompleted: number;
      totalGoals: number;
    }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (weeks * 7));

      const weeklyData = [];
      let totalGoalsSet = 0;
      let totalGoalsAchieved = 0;
      const categoryStats = new Map<number, {
        categoryName: string;
        completions: number[];
        weeksWithGoals: number;
        weeksCompleted: number;
      }>();

      // Collect data for each week
      for (let weekStart = new Date(startDate); weekStart <= endDate; weekStart.setDate(weekStart.getDate() + 7)) {
        const weekProgress = await this.getWeekProgress(weekStart);
        
        const completionRate = weekProgress.totalGoals > 0 
          ? (weekProgress.completedGoals / weekProgress.totalGoals) * 100 
          : 0;

        weeklyData.push({
          weekStart: weekProgress.weekStart,
          completionRate,
          totalMinutes: weekProgress.totalCurrentMinutes,
          goalsCompleted: weekProgress.completedGoals,
          totalGoals: weekProgress.totalGoals
        });

        totalGoalsSet += weekProgress.totalGoals;
        totalGoalsAchieved += weekProgress.completedGoals;

        // Track category performance
        for (const goal of weekProgress.goals) {
          if (!categoryStats.has(goal.categoryId)) {
            categoryStats.set(goal.categoryId, {
              categoryName: goal.categoryName,
              completions: [],
              weeksWithGoals: 0,
              weeksCompleted: 0
            });
          }

          const stats = categoryStats.get(goal.categoryId)!;
          stats.completions.push(goal.progressPercentage);
          stats.weeksWithGoals++;
          if (goal.isCompleted) {
            stats.weeksCompleted++;
          }
        }
      }

      // Calculate averages and find best week
      const averageCompletionRate = weeklyData.length > 0 
        ? weeklyData.reduce((sum, week) => sum + week.completionRate, 0) / weeklyData.length 
        : 0;

      const bestWeek = weeklyData.reduce((best, current) => {
        if (!best || current.completionRate > best.completionRate) {
          return current;
        }
        return best;
      }, null as typeof weeklyData[0] | null);

      // Process category performance
      const categoryPerformance = Array.from(categoryStats.entries()).map(([categoryId, stats]) => ({
        categoryId,
        categoryName: stats.categoryName,
        averageCompletion: stats.completions.length > 0 
          ? stats.completions.reduce((sum, comp) => sum + comp, 0) / stats.completions.length 
          : 0,
        weeksWithGoals: stats.weeksWithGoals,
        weeksCompleted: stats.weeksCompleted
      }));

      return {
        averageCompletionRate,
        totalGoalsSet,
        totalGoalsAchieved,
        bestWeek,
        categoryPerformance,
        weeklyTrend: weeklyData.reverse() // Most recent first
      };
    } catch (error) {
      logger.error('Error getting weekly goal statistics:', error);
      return {
        averageCompletionRate: 0,
        totalGoalsSet: 0,
        totalGoalsAchieved: 0,
        bestWeek: null,
        categoryPerformance: [],
        weeklyTrend: []
      };
    }
  }

  /**
   * Get upcoming weekly goals that need attention
   */
  public async getGoalsNeedingAttention(): Promise<Array<{
    categoryId: number;
    categoryName: string;
    categoryColor: string;
    targetMinutes: number;
    currentMinutes: number;
    remainingMinutes: number;
    daysLeft: number;
    dailyTargetToMeetGoal: number;
    riskLevel: 'low' | 'medium' | 'high';
    suggestion: string;
  }>> {
    try {
      const currentWeekProgress = await this.getCurrentWeekProgress();
      const today = new Date();
      const weekEnd = new Date(currentWeekProgress.weekEnd + 'T23:59:59');
      const daysLeft = Math.ceil((weekEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const goalsNeedingAttention = [];

      for (const goal of currentWeekProgress.goals) {
        if (!goal.isCompleted) {
          const remainingMinutes = goal.targetMinutes - goal.currentMinutes;
          const dailyTargetToMeetGoal = daysLeft > 0 ? remainingMinutes / daysLeft : remainingMinutes;

          let riskLevel: 'low' | 'medium' | 'high' = 'low';
          let suggestion = '';

          if (goal.progressPercentage < 25 && daysLeft <= 2) {
            riskLevel = 'high';
            suggestion = `Critical: Need ${Math.ceil(dailyTargetToMeetGoal)} minutes daily to meet goal`;
          } else if (goal.progressPercentage < 50 && daysLeft <= 3) {
            riskLevel = 'medium';
            suggestion = `Focus needed: ${Math.ceil(dailyTargetToMeetGoal)} minutes daily recommended`;
          } else if (dailyTargetToMeetGoal > 60) {
            riskLevel = 'medium';
            suggestion = `Consider breaking into smaller sessions throughout the day`;
          } else {
            riskLevel = 'low';
            suggestion = `On track: ${Math.ceil(dailyTargetToMeetGoal)} minutes daily to complete`;
          }

          goalsNeedingAttention.push({
            categoryId: goal.categoryId,
            categoryName: goal.categoryName,
            categoryColor: goal.categoryColor,
            targetMinutes: goal.targetMinutes,
            currentMinutes: goal.currentMinutes,
            remainingMinutes,
            daysLeft,
            dailyTargetToMeetGoal,
            riskLevel,
            suggestion
          });
        }
      }

      // Sort by risk level (high first) and then by remaining time
      return goalsNeedingAttention.sort((a, b) => {
        const riskOrder = { high: 3, medium: 2, low: 1 };
        if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        }
        return a.daysLeft - b.daysLeft;
      });
    } catch (error) {
      logger.error('Error getting goals needing attention:', error);
      return [];
    }
  }

  /**
   * Celebrate goal achievement
   */
  public async celebrateGoalAchievement(categoryId: number, weekStart: string): Promise<{
    message: string;
    achievement: GoalAchievement | null;
    milestone?: string;
  }> {
    try {
      const weekStartDate = new Date(weekStart);
      const weekProgress = await this.getWeekProgress(weekStartDate);
      const goal = weekProgress.goals.find(g => g.categoryId === categoryId);

      if (!goal || !goal.isCompleted) {
        return {
          message: 'Goal not yet completed',
          achievement: null
        };
      }

      const overachievementPercentage = goal.targetMinutes > 0 
        ? ((goal.currentMinutes - goal.targetMinutes) / goal.targetMinutes) * 100
        : 0;

      const achievement: GoalAchievement = {
        categoryId: goal.categoryId,
        categoryName: goal.categoryName,
        weekStart: goal.weekStart,
        achievedAt: new Date(),
        targetMinutes: goal.targetMinutes,
        actualMinutes: goal.currentMinutes,
        overachievementPercentage: Math.max(0, overachievementPercentage)
      };

      let message = `🎉 Congratulations! You've completed your weekly goal for ${goal.categoryName}!`;
      let milestone = '';

      if (overachievementPercentage > 50) {
        message += ` You exceeded your goal by ${Math.round(overachievementPercentage)}%!`;
        milestone = 'Overachiever';
      } else if (overachievementPercentage > 25) {
        message += ` You exceeded your goal by ${Math.round(overachievementPercentage)}%!`;
        milestone = 'Goal Crusher';
      } else {
        milestone = 'Goal Achiever';
      }

      // Store achievement notification preference
      await this.userSettingsRepository.set(
        `goal_achievement_${categoryId}_${weekStart}`,
        JSON.stringify(achievement)
      );

      return {
        message,
        achievement,
        milestone
      };
    } catch (error) {
      logger.error('Error celebrating goal achievement:', error);
      return {
        message: 'Error celebrating achievement',
        achievement: null
      };
    }
  }
}