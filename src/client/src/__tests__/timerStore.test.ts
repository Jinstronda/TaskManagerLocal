import { useTimerStore } from '../stores/timerStore';
import { TimerService } from '../services/TimerService';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock Notification API
class MockNotification {
  static permission = 'granted';
  static requestPermission = jest.fn().mockResolvedValue('granted');
  
  constructor(title: string, options?: NotificationOptions) {
    // Mock notification instance
  }
  
  onclick = null;
  close = jest.fn();
}

global.Notification = MockNotification as any;

describe('TimerStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useTimerStore.getState().resetTimer();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Timer State Management', () => {
    it('should initialize with correct default state', () => {
      const state = useTimerStore.getState();
      
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentSession).toBe(null);
      expect(state.remainingTime).toBe(0);
      expect(state.sessionType).toBe('deep_work');
      expect(state.plannedDuration).toBe(50); // default deep work duration
    });

    it('should start timer correctly', () => {
      const store = useTimerStore.getState();
      
      store.startTimer('deep_work', 25, undefined, 1);
      
      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.remainingTime).toBe(25 * 60); // 25 minutes in seconds
      expect(state.sessionType).toBe('deep_work');
      expect(state.plannedDuration).toBe(25);
      expect(state.currentSession).not.toBe(null);
      expect(state.startTime).not.toBe(null);
    });

    it('should pause timer correctly', () => {
      const store = useTimerStore.getState();
      
      // Start timer first
      store.startTimer('deep_work', 25);
      store.pauseTimer();
      
      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(true);
      expect(state.lastTickTime).toBe(null);
    });

    it('should resume timer correctly', () => {
      const store = useTimerStore.getState();
      
      // Start and pause timer
      store.startTimer('deep_work', 25);
      store.pauseTimer();
      store.resumeTimer();
      
      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.lastTickTime).not.toBe(null);
      expect(state.isSystemSleepDetected).toBe(false);
    });

    it('should stop timer correctly', () => {
      const store = useTimerStore.getState();
      
      // Start timer first
      store.startTimer('deep_work', 25);
      store.stopTimer();
      
      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.remainingTime).toBe(0);
      expect(state.startTime).toBe(null);
    });

    it('should update session type correctly', () => {
      const store = useTimerStore.getState();
      
      store.updateSessionType('quick_task');
      
      const state = useTimerStore.getState();
      expect(state.sessionType).toBe('quick_task');
      expect(state.plannedDuration).toBe(15); // default quick task duration
      expect(state.remainingTime).toBe(15 * 60);
    });

    it('should update planned duration correctly', () => {
      const store = useTimerStore.getState();
      
      store.updatePlannedDuration(30);
      
      const state = useTimerStore.getState();
      expect(state.plannedDuration).toBe(30);
      expect(state.remainingTime).toBe(30 * 60);
    });
  });

  describe('Timer Tick Functionality', () => {
    it('should decrease remaining time on tick', () => {
      const store = useTimerStore.getState();
      
      // Start timer
      store.startTimer('deep_work', 25);
      const initialRemainingTime = useTimerStore.getState().remainingTime;
      
      // Simulate time passing
      jest.advanceTimersByTime(1000); // 1 second
      store.tick();
      
      const state = useTimerStore.getState();
      expect(state.remainingTime).toBeLessThan(initialRemainingTime);
    });

    it('should not tick when paused', () => {
      const store = useTimerStore.getState();
      
      // Start and pause timer
      store.startTimer('deep_work', 25);
      const initialRemainingTime = useTimerStore.getState().remainingTime;
      store.pauseTimer();
      
      // Simulate time passing
      jest.advanceTimersByTime(1000);
      store.tick();
      
      const state = useTimerStore.getState();
      expect(state.remainingTime).toBe(initialRemainingTime);
    });

    it('should not tick when not running', () => {
      const store = useTimerStore.getState();
      
      // Don't start timer
      const initialRemainingTime = useTimerStore.getState().remainingTime;
      
      // Simulate time passing
      jest.advanceTimersByTime(1000);
      store.tick();
      
      const state = useTimerStore.getState();
      expect(state.remainingTime).toBe(initialRemainingTime);
    });

    it('should detect system sleep', () => {
      const store = useTimerStore.getState();
      
      // Start timer
      store.startTimer('deep_work', 25);
      
      // Simulate system sleep (large time gap)
      const state = useTimerStore.getState();
      useTimerStore.setState({
        lastTickTime: Date.now() - 150000, // 2.5 minutes ago
      });
      
      store.tick();
      
      const newState = useTimerStore.getState();
      expect(newState.isSystemSleepDetected).toBe(true);
      expect(newState.isPaused).toBe(true);
    });

    it('should complete session when time runs out', async () => {
      const store = useTimerStore.getState();
      
      // Mock the completeSession method
      const completeSessionSpy = jest.spyOn(store, 'completeSession');
      
      // Start timer with very short duration
      store.startTimer('deep_work', 1); // 1 minute
      
      // Set remaining time to 0
      useTimerStore.setState({ remainingTime: 0 });
      
      store.tick();
      
      expect(completeSessionSpy).toHaveBeenCalled();
    });
  });

  describe('Session Preferences', () => {
    it('should update session preferences', () => {
      const store = useTimerStore.getState();
      
      const newPreferences = {
        deepWorkDuration: 60,
        soundEnabled: false,
      };
      
      store.updateSessionPreferences(newPreferences);
      
      const state = useTimerStore.getState();
      expect(state.sessionPreferences.deepWorkDuration).toBe(60);
      expect(state.sessionPreferences.soundEnabled).toBe(false);
      expect(state.sessionPreferences.notificationsEnabled).toBe(true); // unchanged
    });

    it('should save preferences to localStorage', () => {
      const store = useTimerStore.getState();
      
      const newPreferences = {
        deepWorkDuration: 60,
      };
      
      store.updateSessionPreferences(newPreferences);
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'sessionPreferences',
        expect.stringContaining('"deepWorkDuration":60')
      );
    });

    it('should get correct duration when updating session type', () => {
      const store = useTimerStore.getState();
      
      store.updateSessionType('deep_work');
      expect(useTimerStore.getState().plannedDuration).toBe(50);
      
      store.updateSessionType('quick_task');
      expect(useTimerStore.getState().plannedDuration).toBe(15);
      
      store.updateSessionType('break');
      expect(useTimerStore.getState().plannedDuration).toBe(10);
      
      store.updateSessionType('custom');
      expect(useTimerStore.getState().plannedDuration).toBe(25);
    });
  });

  describe('System Sleep Detection', () => {
    it('should detect system sleep correctly', () => {
      const store = useTimerStore.getState();
      
      // Start timer
      store.startTimer('deep_work', 25);
      
      // Simulate old last active time (system sleep)
      useTimerStore.setState({
        lastActiveTime: Date.now() - 150000, // 2.5 minutes ago
      });
      
      store.detectSystemSleep();
      
      const state = useTimerStore.getState();
      expect(state.isSystemSleepDetected).toBe(true);
      expect(state.isPaused).toBe(true);
    });

    it('should update last active time', () => {
      const store = useTimerStore.getState();
      const initialTime = useTimerStore.getState().lastActiveTime;
      
      // Wait a bit
      jest.advanceTimersByTime(1000);
      
      store.updateLastActiveTime();
      
      const state = useTimerStore.getState();
      expect(state.lastActiveTime).toBeGreaterThan(initialTime);
      expect(state.isSystemSleepDetected).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should create session on server when starting timer', () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 123 } }),
      } as Response);

      const store = useTimerStore.getState();
      store.startTimer('deep_work', 25, 1, 2);

      expect(fetch).toHaveBeenCalledWith('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"sessionType":"deep_work"'),
      });
    });

    it('should complete session correctly', async () => {
      const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);

      const store = useTimerStore.getState();
      
      // Start timer and set up session
      store.startTimer('deep_work', 25);
      useTimerStore.setState({
        currentSession: {
          id: 123,
          categoryId: 1,
          sessionType: 'deep_work',
          startTime: new Date(),
          plannedDuration: 25,
          completed: false,
          createdAt: new Date(),
        },
        remainingTime: 300, // 5 minutes remaining
      });

      await store.completeSession(4, 'Good session');

      const state = useTimerStore.getState();
      expect(state.isRunning).toBe(false);
      expect(state.currentSession).toBe(null);
      expect(fetch).toHaveBeenCalledWith('/api/sessions/123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"completed":true'),
      });
    });
  });
});

describe('TimerService', () => {
  let timerService: TimerService;

  beforeEach(() => {
    timerService = new TimerService();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    timerService.stop();
    jest.useRealTimers();
  });

  describe('Time Formatting', () => {
    it('should format time correctly without hours', () => {
      expect(timerService.formatTime(65)).toBe('01:05');
      expect(timerService.formatTime(3661)).toBe('61:01');
      expect(timerService.formatTime(0)).toBe('00:00');
    });

    it('should format time correctly with hours', () => {
      expect(timerService.formatTime(3661, true)).toBe('01:01:01');
      expect(timerService.formatTime(65, true)).toBe('00:01:05');
      expect(timerService.formatTime(7200, true)).toBe('02:00:00');
    });
  });

  describe('Session Progress Calculation', () => {
    it('should calculate progress correctly', () => {
      expect(timerService.getSessionProgress(900, 25)).toBe(40); // 15 minutes elapsed out of 25
      expect(timerService.getSessionProgress(0, 25)).toBe(100); // completed
      expect(timerService.getSessionProgress(1500, 25)).toBe(0); // just started
    });

    it('should handle edge cases', () => {
      expect(timerService.getSessionProgress(-100, 25)).toBe(100); // over time
      expect(timerService.getSessionProgress(2000, 25)).toBe(0); // more time than planned
    });
  });

  describe('Session Type Utilities', () => {
    it('should return correct display names', () => {
      expect(timerService.getSessionTypeDisplayName('deep_work')).toBe('Deep Work');
      expect(timerService.getSessionTypeDisplayName('quick_task')).toBe('Quick Task');
      expect(timerService.getSessionTypeDisplayName('break')).toBe('Break Time');
      expect(timerService.getSessionTypeDisplayName('custom')).toBe('Custom Session');
      expect(timerService.getSessionTypeDisplayName('unknown')).toBe('Focus Session');
    });

    it('should return correct colors', () => {
      expect(timerService.getSessionTypeColor('deep_work')).toBe('#3B82F6');
      expect(timerService.getSessionTypeColor('quick_task')).toBe('#10B981');
      expect(timerService.getSessionTypeColor('break')).toBe('#F59E0B');
      expect(timerService.getSessionTypeColor('custom')).toBe('#8B5CF6');
      expect(timerService.getSessionTypeColor('unknown')).toBe('#6B7280');
    });
  });

  describe('Timer State Recovery', () => {
    it('should recover timer state successfully', () => {
      const mockTimerState = {
        isRunning: true,
        isPaused: false,
        remainingTime: 1200, // 20 minutes
        sessionType: 'deep_work',
        plannedDuration: 25,
        startTime: Date.now() - 60000, // 1 minute ago
        pausedTime: 0,
        currentSession: {
          id: 123,
          categoryId: 1,
          sessionType: 'deep_work',
          startTime: new Date(),
          plannedDuration: 25,
          completed: false,
          createdAt: new Date(),
        },
        lastActiveTime: Date.now() - 60000, // 1 minute ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockTimerState));

      const result = timerService.recoverTimerState();

      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('timerState');
    });

    it('should not recover if too much time has passed', () => {
      const mockTimerState = {
        isRunning: true,
        lastActiveTime: Date.now() - 15 * 60 * 1000, // 15 minutes ago
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockTimerState));

      const result = timerService.recoverTimerState();

      expect(result).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('timerState');
    });

    it('should handle recovery errors gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = timerService.recoverTimerState();

      expect(result).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('timerState');
    });
  });
});