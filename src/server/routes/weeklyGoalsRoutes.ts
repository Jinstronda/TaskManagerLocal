import { Router } from 'express';
import { WeeklyGoalsService } from '../services/WeeklyGoalsService';
import { logger } from '../utils/logger';

export function createWeeklyGoalsRoutes(): Router {
  const router = Router();
  const weeklyGoalsService = new WeeklyGoalsService();

  /**
   * GET /api/weekly-goals/current
   * Get current week's goals and progress
   */
  router.get('/current', async (req, res) => {
    try {
      const progress = await weeklyGoalsService.getCurrentWeekProgress();
      res.json(progress);
    } catch (error) {
      logger.error('Error getting current week progress:', error);
      res.status(500).json({ error: 'Failed to get current week progress' });
    }
  });

  /**
   * GET /api/weekly-goals/week/:date
   * Get weekly goals and progress for a specific week
   */
  router.get('/week/:date', async (req, res) => {
    try {
      const { date } = req.params;
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        return;
      }

      const weekDate = new Date(date);
      const progress = await weeklyGoalsService.getWeekProgress(weekDate);
      res.json(progress);
    } catch (error) {
      logger.error('Error getting week progress:', error);
      res.status(500).json({ error: 'Failed to get week progress' });
    }
  });

  /**
   * PUT /api/weekly-goals/category/:categoryId
   * Update weekly goal for a category
   */
  router.put('/category/:categoryId', async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { targetMinutes } = req.body;

      if (typeof targetMinutes !== 'number' || targetMinutes < 0) {
        res.status(400).json({ error: 'targetMinutes must be a non-negative number' });
        return;
      }

      await weeklyGoalsService.updateCategoryWeeklyGoal(parseInt(categoryId), targetMinutes);
      res.json({ success: true, message: 'Weekly goal updated successfully' });
    } catch (error) {
      logger.error('Error updating weekly goal:', error);
      res.status(500).json({ error: 'Failed to update weekly goal' });
    }
  });

  /**
   * GET /api/weekly-goals/achievements
   * Get goal achievements for a date range
   */
  router.get('/achievements', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const achievements = await weeklyGoalsService.getGoalAchievements(
        startDate as string,
        endDate as string
      );
      
      res.json(achievements);
    } catch (error) {
      logger.error('Error getting goal achievements:', error);
      res.status(500).json({ error: 'Failed to get goal achievements' });
    }
  });

  /**
   * GET /api/weekly-goals/statistics
   * Get weekly goal statistics
   */
  router.get('/statistics', async (req, res) => {
    try {
      const { weeks } = req.query;
      const weeksCount = weeks ? parseInt(weeks as string) : 12;

      if (isNaN(weeksCount) || weeksCount < 1 || weeksCount > 52) {
        res.status(400).json({ error: 'weeks must be a number between 1 and 52' });
        return;
      }

      const statistics = await weeklyGoalsService.getWeeklyGoalStatistics(weeksCount);
      res.json(statistics);
    } catch (error) {
      logger.error('Error getting weekly goal statistics:', error);
      res.status(500).json({ error: 'Failed to get weekly goal statistics' });
    }
  });

  /**
   * GET /api/weekly-goals/attention
   * Get goals that need attention
   */
  router.get('/attention', async (req, res) => {
    try {
      const goalsNeedingAttention = await weeklyGoalsService.getGoalsNeedingAttention();
      res.json(goalsNeedingAttention);
    } catch (error) {
      logger.error('Error getting goals needing attention:', error);
      res.status(500).json({ error: 'Failed to get goals needing attention' });
    }
  });

  /**
   * POST /api/weekly-goals/celebrate/:categoryId/:weekStart
   * Celebrate goal achievement
   */
  router.post('/celebrate/:categoryId/:weekStart', async (req, res) => {
    try {
      const { categoryId, weekStart } = req.params;

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
        res.status(400).json({ error: 'Invalid weekStart format. Use YYYY-MM-DD' });
        return;
      }

      const celebration = await weeklyGoalsService.celebrateGoalAchievement(
        parseInt(categoryId),
        weekStart
      );
      
      res.json(celebration);
    } catch (error) {
      logger.error('Error celebrating goal achievement:', error);
      res.status(500).json({ error: 'Failed to celebrate goal achievement' });
    }
  });

  return router;
}