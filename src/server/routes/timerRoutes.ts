import { Router } from 'express';
import { BackgroundTimerService } from '../services/BackgroundTimerService';
import { NotificationService } from '../services/NotificationService';
import { SystemTrayService } from '../services/SystemTrayService';
import { SessionRepository } from '../database/repositories/SessionRepository';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { ApiResponse } from '../../shared/types';
import { logger } from '../utils/logger';

export function createTimerRoutes(
  backgroundTimerService: BackgroundTimerService,
  notificationService: NotificationService,
  systemTrayService: SystemTrayService | null,
  sessionRepository: SessionRepository
): Router {
  const router = Router();

  /**
   * Start a background timer
   */
  router.post('/start', async (req, res) => {
    try {
      const { sessionType, plannedDuration, taskId, categoryId } = req.body;
      const clientId = req.headers['x-client-id'] as string || 'default';

      logger.info(`Timer start request - sessionType: ${sessionType}, plannedDuration: ${plannedDuration}, taskId: ${taskId}, categoryId: ${categoryId}, clientId: ${clientId}`);

      // If no categoryId provided, get the first available category
      let finalCategoryId = categoryId;
      if (!finalCategoryId) {
        const categoryRepository = new CategoryRepository();
        const categories = await categoryRepository.findAll();
        if (categories.length > 0 && categories[0]) {
          finalCategoryId = categories[0].id;
        } else {
          throw new Error('No categories available. Please create a category first.');
        }
      }

      logger.info(`Using finalCategoryId: ${finalCategoryId}`);

      // Create session in database
      const session = await sessionRepository.create({
        taskId: taskId || null, // Ensure null instead of undefined for SQLite
        categoryId: finalCategoryId,
        sessionType,
        startTime: new Date(),
        plannedDuration,
        completed: false,
      });

      // Start background timer
      backgroundTimerService.startTimer(clientId, session);

      // Update system tray if available
      if (systemTrayService) {
        const timerState = backgroundTimerService.getTimerState(clientId);
        systemTrayService.updateTimerStatus(timerState);
        systemTrayService.updateMenuStates(false, true, true);
      }

      const timerState = backgroundTimerService.getTimerState(clientId);
      const response: ApiResponse = {
        success: true,
        data: {
          sessionId: session.id,
          timerState,
        },
      };

      res.json(response);
      logger.info(`Timer started for session ${session.id} (client: ${clientId})`);
    } catch (error) {
      logger.error('Failed to start timer:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to start timer',
          statusCode: 500,
        },
      };
      res.status(500).json(response);
    }
  });

  /**
   * Pause a background timer
   */
  router.post('/pause', async (req, res) => {
    try {
      const clientId = req.headers['x-client-id'] as string || 'default';

      backgroundTimerService.pauseTimer(clientId);

      // Update system tray if available
      if (systemTrayService) {
        const timerState = backgroundTimerService.getTimerState(clientId);
        systemTrayService.updateTimerStatus(timerState);
        systemTrayService.updateMenuStates(false, false, true);
      }

      const timerState = backgroundTimerService.getTimerState(clientId);
      const response: ApiResponse = {
        success: true,
        data: { timerState },
      };

      res.json(response);
      logger.info(`Timer paused (client: ${clientId})`);
    } catch (error) {
      logger.error('Failed to pause timer:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to pause timer',
          statusCode: 500,
        },
      };
      res.status(500).json(response);
    }
  });

  /**
   * Resume a background timer
   */
  router.post('/resume', async (req, res) => {
    try {
      const clientId = req.headers['x-client-id'] as string || 'default';

      backgroundTimerService.resumeTimer(clientId);

      // Update system tray if available
      if (systemTrayService) {
        const timerState = backgroundTimerService.getTimerState(clientId);
        systemTrayService.updateTimerStatus(timerState);
        systemTrayService.updateMenuStates(false, true, true);
      }

      const timerState = backgroundTimerService.getTimerState(clientId);
      const response: ApiResponse = {
        success: true,
        data: { timerState },
      };

      res.json(response);
      logger.info(`Timer resumed (client: ${clientId})`);
    } catch (error) {
      logger.error('Failed to resume timer:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to resume timer',
          statusCode: 500,
        },
      };
      res.status(500).json(response);
    }
  });

  /**
   * Stop a background timer
   */
  router.post('/stop', async (req, res) => {
    try {
      const clientId = req.headers['x-client-id'] as string || 'default';

      backgroundTimerService.stopTimer(clientId);

      // Update system tray if available
      if (systemTrayService) {
        systemTrayService.updateTimerStatus(null);
        systemTrayService.updateMenuStates(true, false, false);
      }

      const response: ApiResponse = {
        success: true,
        data: { stopped: true },
      };

      res.json(response);
      logger.info(`Timer stopped (client: ${clientId})`);
    } catch (error) {
      logger.error('Failed to stop timer:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to stop timer',
          statusCode: 500,
        },
      };
      res.status(500).json(response);
    }
  });

  /**
   * Complete a background timer
   */
  router.post('/complete', async (req, res) => {
    try {
      const { qualityRating, notes } = req.body;
      const clientId = req.headers['x-client-id'] as string || 'default';

      await backgroundTimerService.completeTimer(clientId, qualityRating, notes);

      // Update system tray if available
      if (systemTrayService) {
        systemTrayService.updateTimerStatus(null);
        systemTrayService.updateMenuStates(true, false, false);
      }

      const response: ApiResponse = {
        success: true,
        data: { completed: true },
      };

      res.json(response);
      logger.info(`Timer completed (client: ${clientId})`);
    } catch (error) {
      logger.error('Failed to complete timer:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to complete timer',
          statusCode: 500,
        },
      };
      res.status(500).json(response);
    }
  });

  /**
   * Get timer status
   */
  router.get('/status', (req, res) => {
    try {
      const clientId = req.headers['x-client-id'] as string || 'default';
      const timerState = backgroundTimerService.getTimerState(clientId);
      const remainingTime = backgroundTimerService.getRemainingTime(clientId);
      const isIdle = backgroundTimerService.isClientIdle(clientId);

      const response: ApiResponse = {
        success: true,
        data: {
          timerState,
          remainingTime: Math.round(remainingTime / 1000), // convert to seconds
          isIdle,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get timer status:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get timer status',
          statusCode: 500,
        },
      };
      res.status(500).json(response);
    }
  });

  /**
   * Update last active time (for idle detection)
   */
  router.post('/heartbeat', (req, res) => {
    try {
      const clientId = req.headers['x-client-id'] as string || 'default';
      backgroundTimerService.updateLastActiveTime(clientId);

      const response: ApiResponse = {
        success: true,
        data: { updated: true },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to update heartbeat:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to update heartbeat',
          statusCode: 500,
        },
      };
      res.status(500).json(response);
    }
  });

  /**
   * Test notification system
   */
  router.post('/test-notification', async (req, res) => {
    try {
      await notificationService.testNotification();

      const response: ApiResponse = {
        success: true,
        data: { sent: true },
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to send test notification:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to send test notification',
          statusCode: 500,
        },
      };
      res.status(500).json(response);
    }
  });

  /**
   * Get system tray status
   */
  router.get('/tray-status', (req, res) => {
    try {
      const status = systemTrayService ? systemTrayService.getStatus() : {
        supported: false,
        active: false,
        initialized: false,
        timerState: null
      };

      const response: ApiResponse = {
        success: true,
        data: status,
      };

      res.json(response);
    } catch (error) {
      logger.error('Failed to get tray status:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Failed to get tray status',
          statusCode: 500,
        },
      };
      res.status(500).json(response);
    }
  });

  return router;
}