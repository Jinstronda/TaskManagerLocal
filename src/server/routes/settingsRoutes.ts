import { Router } from 'express';
import { UserSettingsRepository } from '../database/repositories/UserSettingsRepository';
import { logger } from '../utils/logger';

const router = Router();

// Create repository instance lazily to avoid initialization issues
const getUserSettingsRepo = () => new UserSettingsRepository();

// Get notification preferences
router.get('/notification-preferences', async (req, res) => {
  try {
    const preferences = await getUserSettingsRepo().getNotificationPreferences();
    res.json(preferences);
  } catch (error) {
    logger.error('Failed to get notification preferences:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

// Update notification preferences
router.put('/notification-preferences', async (req, res) => {
  try {
    const preferences = req.body;
    await getUserSettingsRepo().updateNotificationPreferences(preferences);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Get mindfulness settings
router.get('/mindfulness', async (req, res) => {
  try {
    const settings = await getUserSettingsRepo().getMindfulnessSettings();
    res.json(settings);
  } catch (error) {
    logger.error('Failed to get mindfulness settings:', error);
    res.status(500).json({ error: 'Failed to get mindfulness settings' });
  }
});

// Update mindfulness settings
router.put('/mindfulness', async (req, res) => {
  try {
    const settings = req.body;
    await getUserSettingsRepo().updateMindfulnessSettings(settings);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update mindfulness settings:', error);
    res.status(500).json({ error: 'Failed to update mindfulness settings' });
  }
});

export default router;