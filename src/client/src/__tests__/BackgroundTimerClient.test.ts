import { BackgroundTimerClient } from '../services/BackgroundTimerClient';

// Mock fetch
global.fetch = jest.fn();

describe('BackgroundTimerClient', () => {
  let client: BackgroundTimerClient;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new BackgroundTimerClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    client.cleanup();
  });

  describe('Timer Operations', () => {
    it('should start timer successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            sessionId: 123,
            timerState: { isRunning: true },
          },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      const result = await client.startTimer('deep_work', 25, 1, 2);

      expect(mockFetch).toHaveBeenCalledWith('/api/timer/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': expect.stringMatching(/^client_\d+_[a-z0-9]+$/),
        },
        body: JSON.stringify({
          sessionType: 'deep_work',
          plannedDuration: 25,
          taskId: 1,
          categoryId: 2,
        }),
      });

      expect(result).toEqual({
        sessionId: 123,
        timerState: { isRunning: true },
      });
    });

    it('should pause timer successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { timerState: { isPaused: true } },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      await client.pauseTimer();

      expect(mockFetch).toHaveBeenCalledWith('/api/timer/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': expect.stringMatching(/^client_\d+_[a-z0-9]+$/),
        },
      });
    });

    it('should resume timer successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { timerState: { isRunning: true, isPaused: false } },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      await client.resumeTimer();

      expect(mockFetch).toHaveBeenCalledWith('/api/timer/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': expect.stringMatching(/^client_\d+_[a-z0-9]+$/),
        },
      });
    });

    it('should stop timer successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { stopped: true },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      await client.stopTimer();

      expect(mockFetch).toHaveBeenCalledWith('/api/timer/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': expect.stringMatching(/^client_\d+_[a-z0-9]+$/),
        },
      });
    });

    it('should complete timer successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { completed: true },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      await client.completeTimer(4, 'Good session');

      expect(mockFetch).toHaveBeenCalledWith('/api/timer/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': expect.stringMatching(/^client_\d+_[a-z0-9]+$/),
        },
        body: JSON.stringify({
          qualityRating: 4,
          notes: 'Good session',
        }),
      });
    });
  });

  describe('Status Operations', () => {
    it('should get timer status successfully', async () => {
      const mockStatus = {
        timerState: { isRunning: true },
        remainingTime: 1200,
        isIdle: false,
      };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockStatus,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      const result = await client.getTimerStatus();

      expect(mockFetch).toHaveBeenCalledWith('/api/timer/status', {
        method: 'GET',
        headers: {
          'X-Client-Id': expect.stringMatching(/^client_\d+_[a-z0-9]+$/),
        },
      });

      expect(result).toEqual(mockStatus);
    });

    it('should test notification successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { sent: true },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      await client.testNotification();

      expect(mockFetch).toHaveBeenCalledWith('/api/timer/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should get tray status successfully', async () => {
      const mockTrayStatus = {
        supported: true,
        active: true,
        timerState: null,
      };
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockTrayStatus,
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      const result = await client.getTrayStatus();

      expect(mockFetch).toHaveBeenCalledWith('/api/timer/tray-status', {
        method: 'GET',
      });

      expect(result).toEqual(mockTrayStatus);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.startTimer('deep_work', 25)).rejects.toThrow('Network error');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      await expect(client.startTimer('deep_work', 25)).rejects.toThrow('Failed to start background timer');
    });

    it('should handle API error responses', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          success: false,
          error: { message: 'Invalid session type' },
        }),
      };
      mockFetch.mockResolvedValueOnce(mockResponse as Response);

      await expect(client.startTimer('invalid_type' as any, 25)).rejects.toThrow('Invalid session type');
    });
  });

  describe('Client ID', () => {
    it('should generate unique client ID', () => {
      const client1 = new BackgroundTimerClient();
      const client2 = new BackgroundTimerClient();

      expect(client1.getClientId()).not.toBe(client2.getClientId());
      expect(client1.getClientId()).toMatch(/^client_\d+_[a-z0-9]+$/);
      expect(client2.getClientId()).toMatch(/^client_\d+_[a-z0-9]+$/);

      client1.cleanup();
      client2.cleanup();
    });

    it('should check if background timer is supported', () => {
      expect(client.isSupported()).toBe(true);
    });
  });
});