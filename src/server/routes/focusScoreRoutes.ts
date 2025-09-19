import { Router } from 'express';
import { FocusScoreService } from '../services/FocusScoreService';
import { logger } from '../utils/logger';

export function createFocusScoreRoutes(): Router {
  const router = Router();
  const focusScoreService = new FocusScoreService();

  /**
   * GET /api/focus-score/calculate/:date
   * Calculate focus score for a specific date
   */
  router.get('/calculate/:date', async (req, res) => {
    try {
      const { date } = req.params;
      
      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        return;
      }

      const scoreBreakdown = await focusScoreService.calculateFocusScore(date);
      res.json(scoreBreakdown);
    } catch (error) {
      logger.error('Error calculating focus score:', error);
      res.status(500).json({ error: 'Failed to calculate focus score' });
    }
  });

  /**
   * GET /api/focus-score/habit-chain
   * Generate habit chain visualization
   */
  router.get('/habit-chain', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate and endDate are required' });
        return;
      }

      // Validate date formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate as string) || 
          !/^\d{4}-\d{2}-\d{2}$/.test(endDate as string)) {
        res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        return;
      }

      const habitChain = await focusScoreService.generateHabitChain(
        startDate as string,
        endDate as string
      );
      
      res.json(habitChain);
    } catch (error) {
      logger.error('Error generating habit chain:', error);
      res.status(500).json({ error: 'Failed to generate habit chain' });
    }
  });

  /**
   * GET /api/focus-score/statistics
   * Get comprehensive habit statistics
   */
  router.get('/statistics', async (req, res) => {
    try {
      const { days } = req.query;
      const daysCount = days ? parseInt(days as string) : 90;

      if (isNaN(daysCount) || daysCount < 1 || daysCount > 365) {
        res.status(400).json({ error: 'days must be a number between 1 and 365' });
        return;
      }

      const statistics = await focusScoreService.getHabitStatistics(daysCount);
      res.json(statistics);
    } catch (error) {
      logger.error('Error getting habit statistics:', error);
      res.status(500).json({ error: 'Failed to get habit statistics' });
    }
  });

  /**
   * GET /api/focus-score/achievements
   * Get user achievements
   */
  router.get('/achievements', async (req, res) => {
    try {
      const achievements = await focusScoreService.generateAchievements();
      res.json(achievements);
    } catch (error) {
      logger.error('Error getting achievements:', error);
      res.status(500).json({ error: 'Failed to get achievements' });
    }
  });

  /**
   * GET /api/focus-score/trends
   * Get focus score trends for visualization
   */
  router.get('/trends', async (req, res) => {
    try {
      const { days } = req.query;
      const daysCount = days ? parseInt(days as string) : 30;

      if (isNaN(daysCount) || daysCount < 1 || daysCount > 90) {
        res.status(400).json({ error: 'days must be a number between 1 and 90' });
        return;
      }

      const trends = await focusScoreService.getFocusScoreTrends(daysCount);
      res.json(trends);
    } catch (error) {
      logger.error('Error getting focus score trends:', error);
      res.status(500).json({ error: 'Failed to get focus score trends' });
    }
  });

  /**
   * POST /api/focus-score/update-all
   * Update focus scores for all dates with session data
   */
  router.post('/update-all', async (req, res) => {
    try {
      await focusScoreService.updateAllFocusScores();
      res.json({ success: true, message: 'All focus scores updated successfully' });
    } catch (error) {
      logger.error('Error updating all focus scores:', error);
      res.status(500).json({ error: 'Failed to update focus scores' });
    }
  });

  return router;
}