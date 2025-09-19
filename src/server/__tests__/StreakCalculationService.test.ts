import { StreakCalculationService } from '../services/StreakCalculationService';
import { DailyStatsRepository } from '../database/repositories/DailyStatsRepository';
import { SessionRepository } from '../database/repositories/SessionRepository';
import { UserSettingsRepository } from '../database/repositories/UserSettingsRepository';

// Mock the repositories
jest.mock('../database/repositories/DailyStatsRepository');
jest.mock('../database/repositories/SessionRepository');
jest.mock('../database/repositories/UserSettingsRepository');

describe('StreakCalculationService', () => {
  let streakService: StreakCalculationService;
  let mockDailyStatsRepo: jest.Mocked<DailyStatsRepository>;
  let mockSessionRepo: jest.Mocked<SessionRepository>;
  let mockUserSettingsRepo: jest.Mocked<UserSettingsRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create service instance
    streakService = new StreakCalculationService();
    
    // Get mocked instances
    mockDailyStatsRepo = DailyStatsRepository.prototype as jest.Mocked<DailyStatsRepository>;
    mockSessionRepo = SessionRepository.prototype as jest.Mocked<SessionRepository>;
    mockUserSettingsRepo = UserSettingsRepository.prototype as jest.Mocked<UserSettingsRepository>;
  });

  describe('calculateStreakDay', () => {
    it('should return true when focus time meets minimum requirement', async () => {
      // Mock user settings
      mockUserSettingsRepo.getMultiple.mockResolvedValue({
        streak_minimum_focus_time: '25'
      });

      // Mock sessions with 30 minutes total focus time
      mockSessionRepo.findByDateRange.mockResolvedValue([
        {
          id: 1,
          categoryId: 1,
          sessionType: 'deep_work',
          startTime: new Date('2023-01-01T10:00:00'),
          endTime: new Date('2023-01-01T10:30:00'),
          plannedDuration: 30,
          actualDuration: 30,
          completed: true,
          createdAt: new Date()
        }
      ]);

      const result = await streakService.calculateStreakDay('2023-01-01');
      expect(result).toBe(true);
    });

    it('should return false when focus time is below minimum requirement', async () => {
      // Mock user settings
      mockUserSettingsRepo.getMultiple.mockResolvedValue({
        streak_minimum_focus_time: '25'
      });

      // Mock sessions with 20 minutes total focus time
      mockSessionRepo.findByDateRange.mockResolvedValue([
        {
          id: 1,
          categoryId: 1,
          sessionType: 'deep_work',
          startTime: new Date('2023-01-01T10:00:00'),
          endTime: new Date('2023-01-01T10:20:00'),
          plannedDuration: 20,
          actualDuration: 20,
          completed: true,
          createdAt: new Date()
        }
      ]);

      const result = await streakService.calculateStreakDay('2023-01-01');
      expect(result).toBe(false);
    });

    it('should only count completed sessions', async () => {
      // Mock user settings
      mockUserSettingsRepo.getMultiple.mockResolvedValue({
        streak_minimum_focus_time: '25'
      });

      // Mock sessions with one completed (20 min) and one incomplete (30 min)
      mockSessionRepo.findByDateRange.mockResolvedValue([
        {
          id: 1,
          categoryId: 1,
          sessionType: 'deep_work',
          startTime: new Date('2023-01-01T10:00:00'),
          endTime: new Date('2023-01-01T10:20:00'),
          plannedDuration: 20,
          actualDuration: 20,
          completed: true,
          createdAt: new Date()
        },
        {
          id: 2,
          categoryId: 1,
          sessionType: 'deep_work',
          startTime: new Date('2023-01-01T11:00:00'),
          plannedDuration: 30,
          actualDuration: 30,
          completed: false, // Not completed
          createdAt: new Date()
        }
      ]);

      const result = await streakService.calculateStreakDay('2023-01-01');
      expect(result).toBe(false); // Only 20 minutes from completed sessions
    });
  });

  describe('updateDailyStats', () => {
    it('should update daily stats and mark streak day correctly', async () => {
      const testDate = '2023-01-01';
      
      // Mock calculateStreakDay to return true
      jest.spyOn(streakService, 'calculateStreakDay').mockResolvedValue(true);
      
      // Mock daily stats repository methods
      mockDailyStatsRepo.calculateAndUpdateFromSessions.mockResolvedValue({
        date: testDate,
        totalFocusTime: 30,
        sessionsCompleted: 1,
        focusScore: 75,
        streakDay: false, // Initially false
        createdAt: new Date()
      });

      mockDailyStatsRepo.markStreakDay.mockResolvedValue({
        date: testDate,
        totalFocusTime: 30,
        sessionsCompleted: 1,
        focusScore: 75,
        streakDay: true, // Updated to true
        createdAt: new Date()
      });

      const result = await streakService.updateDailyStats(testDate);
      
      expect(mockDailyStatsRepo.calculateAndUpdateFromSessions).toHaveBeenCalledWith(testDate);
      expect(mockDailyStatsRepo.markStreakDay).toHaveBeenCalledWith(testDate, true);
      expect(result.streakDay).toBe(true);
    });
  });

  describe('calculateCurrentStreak', () => {
    it('should calculate current streak correctly', async () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Mock user settings
      mockUserSettingsRepo.getMultiple.mockResolvedValue({
        streak_minimum_focus_time: '25',
        streak_grace_period_days: '1',
        streak_recovery_enabled: 'true'
      });

      // Mock streak data from repository
      mockDailyStatsRepo.getCurrentStreak.mockResolvedValue({
        currentStreak: 0, // This will be recalculated
        longestStreak: 5,
        streakDates: [yesterday, today]
      });

      const result = await streakService.calculateCurrentStreak();
      
      expect(result.longestStreak).toBe(5);
      expect(result.streakDates).toContain(today);
      expect(result.streakDates).toContain(yesterday);
    });

    it('should handle grace period correctly', async () => {
      const today = new Date().toISOString().split('T')[0];
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Mock user settings with 1-day grace period
      mockUserSettingsRepo.getSettings.mockResolvedValue({
        streak_minimum_focus_time: '25',
        streak_grace_period_days: '1',
        streak_recovery_enabled: 'true'
      });

      // Mock streak data - missing yesterday but have day before
      mockDailyStatsRepo.getCurrentStreak.mockResolvedValue({
        currentStreak: 0,
        longestStreak: 3,
        streakDates: [twoDaysAgo] // Missing yesterday
      });

      const result = await streakService.calculateCurrentStreak();
      
      // Should show grace period is active since we missed only 1 day
      expect(result.gracePeriodActive).toBe(true);
      expect(result.gracePeriodEndsAt).toBeDefined();
    });
  });

  describe('recoverStreak', () => {
    it('should successfully recover streak within grace period', async () => {
      const testDate = '2023-01-01';
      
      // Mock settings
      mockUserSettingsRepo.getMultiple.mockResolvedValue({
        streak_recovery_enabled: 'true'
      });

      // Mock calculateCurrentStreak to show active grace period
      jest.spyOn(streakService, 'calculateCurrentStreak').mockResolvedValue({
        currentStreak: 5,
        longestStreak: 10,
        streakDates: [],
        gracePeriodActive: true,
        gracePeriodEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      // Mock calculateStreakDay to return true
      jest.spyOn(streakService, 'calculateStreakDay').mockResolvedValue(true);

      // Mock markStreakDay
      mockDailyStatsRepo.markStreakDay.mockResolvedValue({
        date: testDate,
        totalFocusTime: 30,
        sessionsCompleted: 1,
        focusScore: 75,
        streakDay: true,
        createdAt: new Date()
      });

      const result = await streakService.recoverStreak(testDate);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully recovered');
      expect(mockDailyStatsRepo.markStreakDay).toHaveBeenCalledWith(testDate, true);
    });

    it('should fail to recover streak when grace period is not active', async () => {
      const testDate = '2023-01-01';
      
      // Mock settings
      mockUserSettingsRepo.getMultiple.mockResolvedValue({
        streak_recovery_enabled: 'true'
      });

      // Mock calculateCurrentStreak to show no active grace period
      jest.spyOn(streakService, 'calculateCurrentStreak').mockResolvedValue({
        currentStreak: 0,
        longestStreak: 10,
        streakDates: [],
        gracePeriodActive: false
      });

      const result = await streakService.recoverStreak(testDate);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No active grace period');
    });

    it('should fail to recover streak when recovery is disabled', async () => {
      const testDate = '2023-01-01';
      
      // Mock settings with recovery disabled
      mockUserSettingsRepo.getMultiple.mockResolvedValue({
        streak_recovery_enabled: 'false'
      });

      const result = await streakService.recoverStreak(testDate);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('recovery is disabled');
    });
  });

  describe('getStreakStatistics', () => {
    it('should calculate streak statistics correctly', async () => {
      const startDate = '2023-01-01';
      const endDate = '2023-01-07';
      
      // Mock daily stats for a week
      mockDailyStatsRepo.findByDateRange.mockResolvedValue([
        { date: '2023-01-01', totalFocusTime: 30, sessionsCompleted: 1, focusScore: 75, streakDay: true, createdAt: new Date() },
        { date: '2023-01-02', totalFocusTime: 45, sessionsCompleted: 2, focusScore: 85, streakDay: true, createdAt: new Date() },
        { date: '2023-01-03', totalFocusTime: 15, sessionsCompleted: 1, focusScore: 45, streakDay: false, createdAt: new Date() },
        { date: '2023-01-04', totalFocusTime: 60, sessionsCompleted: 2, focusScore: 90, streakDay: true, createdAt: new Date() },
        { date: '2023-01-05', totalFocusTime: 30, sessionsCompleted: 1, focusScore: 75, streakDay: true, createdAt: new Date() },
        { date: '2023-01-06', totalFocusTime: 0, sessionsCompleted: 0, focusScore: 0, streakDay: false, createdAt: new Date() },
        { date: '2023-01-07', totalFocusTime: 40, sessionsCompleted: 1, focusScore: 80, streakDay: true, createdAt: new Date() }
      ]);

      const result = await streakService.getStreakStatistics(startDate, endDate);
      
      expect(result.totalStreakDays).toBe(5); // 5 out of 7 days
      expect(result.streakPercentage).toBeCloseTo(71.43, 1); // 5/7 * 100
      expect(result.averageFocusTime).toBeCloseTo(31.43, 1); // (30+45+15+60+30+0+40)/7
      expect(result.longestStreakInPeriod).toBe(2); // Days 1-2, then day 4-5, then day 7
      expect(result.streakDays).toHaveLength(5);
    });
  });

  describe('getUpcomingMilestones', () => {
    it('should return upcoming milestones correctly', async () => {
      // Mock current streak of 5 days
      jest.spyOn(streakService, 'calculateCurrentStreak').mockResolvedValue({
        currentStreak: 5,
        longestStreak: 10,
        streakDates: [],
        gracePeriodActive: false
      });

      const result = await streakService.getUpcomingMilestones();
      
      expect(result).toHaveLength(3); // Should return next 3 milestones
      expect(result[0]?.milestone).toBe(7); // Next milestone after 5
      expect(result[0]?.daysToGo).toBe(2); // 7 - 5 = 2
      expect(result[0]?.description).toBe('One Week Warrior');
      
      expect(result[1]?.milestone).toBe(14);
      expect(result[1]?.daysToGo).toBe(9); // 14 - 5 = 9
      
      expect(result[2]?.milestone).toBe(30);
      expect(result[2]?.daysToGo).toBe(25); // 30 - 5 = 25
    });
  });
});