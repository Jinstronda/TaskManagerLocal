import { Router } from 'express';
import { StreakCalculationService } from '../services/StreakCalculationService';
import { logger } from '../utils/logger';

export function createStreakRoutes(): Router {
  const router = Router();
  const streakService = new StreakCalculationService();

  /**
   * GET /api/streaks/current
   * Get current streak information
   */
  router.get('/current', async (req, res) => {
    try {
      const streakInfo = await streakService.calculateCurrentStreak();
      res.json(streakInfo);
    } catch (error) {
      logger.error('Error getting current streak:', error);
      res.status(500).json({ error: 'Failed to get current streak' });
    }
  });

  /**
   * GET /api/streaks/statistics
   * Get streak statistics for a date range
   */
  router.get('/statistics', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      const statistics = await streakService.getStreakStatistics(
        startDate as string,
        endDate as string
      );
      
      res.json(statistics);
    } catch (error) {
      logger.error('Error getting streak statistics:', error);
      res.status(500).json({ error: 'Failed to get streak statistics' });
    }
  });

  /**
   * POST /api/streaks/recover
   * Attempt to recover a broken streak
   */
  router.post('/recover', async (req, res) => {
    try {
      const { date } = req.body;
      
      if (!date) {
        res.status(400).json({ error: 'date is required' });
        return;
      }

      const result = await streakService.recoverStreak(date);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Error recovering streak:', error);
      res.status(500).json({ error: 'Failed to recover streak' });
    }
  });

  /**
   * GET /api/streaks/milestones
   * Get upcoming streak milestones
   */
  router.get('/milestones', async (req, res) => {
    try {
      const milestones = await streakService.getUpcomingMilestones();
      res.json(milestones);
    } catch (error) {
      logger.error('Error getting milestones:', error);
      res.status(500).json({ error: 'Failed to get milestones' });
    }
  });

  /**
   * PUT /api/streaks/settings
   * Update streak settings
   */
  router.put('/settings', async (req, res) => {
    try {
      const { minimumFocusTime, gracePeriodDays, streakRecoveryEnabled } = req.body;
      
      const settings: any = {};
      if (minimumFocusTime !== undefined) settings.minimumFocusTime = minimumFocusTime;
      if (gracePeriodDays !== undefined) settings.gracePeriodDays = gracePeriodDays;
      if (streakRecoveryEnabled !== undefined) settings.streakRecoveryEnabled = streakRecoveryEnabled;

      await streakService.updateStreakSettings(settings);
      res.json({ success: true, message: 'Streak settings updated' });
    } catch (error) {
      logger.error('Error updating streak settings:', error);
      res.status(500).json({ error: 'Failed to update streak settings' });
    }
  });

  /**
   * POST /api/streaks/update-daily/:date
   * Update daily stats and recalculate streak for a specific date
   */
  router.post('/update-daily/:date', async (req, res) => {
    try {
      const { date } = req.params;
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        return;
      }

      const updatedStats = await streakService.updateDailyStats(date);
      res.json(updatedStats);
    } catch (error) {
      logger.error('Error updating daily stats:', error);
      res.status(500).json({ error: 'Failed to update daily stats' });
    }
  });

  return router;
}