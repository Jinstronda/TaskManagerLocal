import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Session, SessionPreferences } from '../../../shared/types';
import { backgroundTimerClient } from '../services/BackgroundTimerClient';

export interface TimerState {
  // Core timer state
  isRunning: boolean;
  isPaused: boolean;
  currentSession: Session | null;
  remainingTime: number; // seconds
  sessionType: Session['sessionType'];
  plannedDuration: number; // minutes
  
  // Timer management
  startTime: number | null; // timestamp
  pausedTime: number; // accumulated paused time in seconds
  lastTickTime: number | null; // for accurate time tracking
  
  // Session preferences
  sessionPreferences: SessionPreferences;
  
  // System state
  isSystemSleepDetected: boolean;
  lastActiveTime: number; // timestamp for sleep detection
}

export interface TimerActions {
  // Timer controls
  startTimer: (sessionType: Session['sessionType'], duration: number, taskId?: number, categoryId?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  
  // Session management
  completeSession: (qualityRating?: number, notes?: string) => Promise<void>;
  updateSessionType: (sessionType: Session['sessionType']) => void;
  updatePlannedDuration: (duration: number) => void;
  
  // Task-session integration
  switchTask: (taskId?: number) => Promise<void>;
  completeCurrentTask: () => Promise<void>;
  updateTaskActualDuration: (taskId: number, additionalMinutes: number) => Promise<void>;
  
  // System integration
  detectSystemSleep: () => void;
  updateLastActiveTime: () => void;
  
  // Preferences
  updateSessionPreferences: (preferences: Partial<SessionPreferences>) => void;
  
  // Reset
  resetTimer: () => void;
  
  // Helper methods
  getDurationForSessionType: (sessionType: Session['sessionType']) => number;
  createSessionOnServer: (session: Session) => Promise<void>;
  updateSessionOnServer: (session: Session) => Promise<void>;
  showCompletionNotification: (session: Session) => void;
}

export type TimerStore = TimerState & TimerActions;

// Default session preferences
const defaultSessionPreferences: SessionPreferences = {
  deepWorkDuration: 50, // minutes
  quickTaskDuration: 15, // minutes
  breakDuration: 10, // minutes
  customDuration: 25, // minutes
  autoStartBreaks: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

// Initial state
const initialState: TimerState = {
  isRunning: false,
  isPaused: false,
  currentSession: null,
  remainingTime: defaultSessionPreferences.deepWorkDuration * 60, // Convert minutes to seconds for initial display
  sessionType: 'deep_work',
  plannedDuration: defaultSessionPreferences.deepWorkDuration,
  startTime: null,
  pausedTime: 0,
  lastTickTime: null,
  sessionPreferences: defaultSessionPreferences,
  isSystemSleepDetected: false,
  lastActiveTime: Date.now(),
};

export const useTimerStore = create<TimerStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    startTimer: (sessionType, duration, taskId, categoryId = null) => {
      const now = Date.now();
      const newSession: Session = {
        id: 0, // Will be set by server
        ...(taskId !== undefined && { taskId }),
        categoryId,
        sessionType,
        startTime: new Date(now),
        plannedDuration: duration,
        completed: false,
        createdAt: new Date(now),
      };

      set({
        isRunning: true,
        isPaused: false,
        currentSession: newSession,
        remainingTime: duration * 60, // convert to seconds
        sessionType,
        plannedDuration: duration,
        startTime: now,
        pausedTime: 0,
        lastTickTime: now,
        isSystemSleepDetected: false,
        lastActiveTime: now,
      });

      // Start the session on the server
      get().createSessionOnServer(newSession);
    },

    pauseTimer: () => {
      const state = get();
      if (!state.isRunning || state.isPaused) return;

      set({
        isPaused: true,
        lastTickTime: null,
      });

      // Pause background timer
      backgroundTimerClient.pauseTimer().catch(error => {
        console.error('Failed to pause background timer:', error);
      });
    },

    resumeTimer: () => {
      const state = get();
      if (!state.isRunning || !state.isPaused) return;

      set({
        isPaused: false,
        lastTickTime: Date.now(),
        lastActiveTime: Date.now(),
        isSystemSleepDetected: false,
      });

      // Resume background timer
      backgroundTimerClient.resumeTimer().catch(error => {
        console.error('Failed to resume background timer:', error);
      });
    },

    stopTimer: () => {
      const state = get();
      if (!state.isRunning) return;

      // Calculate actual duration
      const actualDuration = Math.round((state.plannedDuration * 60 - state.remainingTime) / 60);
      
      set({
        isRunning: false,
        isPaused: false,
        remainingTime: 0,
        startTime: null,
        pausedTime: 0,
        lastTickTime: null,
      });

      // Update session on server if it exists
      if (state.currentSession) {
        get().updateSessionOnServer({
          ...state.currentSession,
          endTime: new Date(),
          actualDuration,
          completed: false, // Stopped, not completed
        });
      }
    },

    tick: () => {
      const state = get();
      if (!state.isRunning || state.isPaused || !state.lastTickTime) return;

      const now = Date.now();
      const deltaTime = Math.floor((now - state.lastTickTime) / 1000); // seconds
      
      // Detect potential system sleep (gap > 2 minutes)
      if (deltaTime > 120) {
        set({
          isSystemSleepDetected: true,
          isPaused: true,
          lastTickTime: null,
        });
        return;
      }

      const newRemainingTime = Math.max(0, state.remainingTime - deltaTime);
      
      set({
        remainingTime: newRemainingTime,
        lastTickTime: now,
        lastActiveTime: now,
      });

      // Auto-complete session when time runs out
      if (newRemainingTime === 0) {
        get().completeSession();
      }
    },

    completeSession: async (qualityRating, notes) => {
      const state = get();
      if (!state.currentSession) return;

      const actualDuration = Math.round((state.plannedDuration * 60 - state.remainingTime) / 60);
      const completedSession: Session = {
        ...state.currentSession!,
        endTime: new Date(),
        actualDuration,
        ...(qualityRating !== undefined && { qualityRating }),
        ...(notes !== undefined && { notes }),
        completed: true,
      };

      set({
        isRunning: false,
        isPaused: false,
        remainingTime: 0,
        startTime: null,
        pausedTime: 0,
        lastTickTime: null,
        currentSession: null,
      });

      // Update session on server
      await get().updateSessionOnServer(completedSession);
      
      // Show completion notification
      get().showCompletionNotification(completedSession);
    },

    updateSessionType: (sessionType) => {
      const state = get();
      const duration = get().getDurationForSessionType(sessionType);
      
      set({
        sessionType,
        plannedDuration: duration,
        remainingTime: state.isRunning ? state.remainingTime : duration * 60,
      });

      if (state.currentSession) {
        set({
          currentSession: {
            ...state.currentSession,
            sessionType,
            plannedDuration: duration,
          },
        });
      }
    },

    updatePlannedDuration: (duration) => {
      const state = get();
      set({
        plannedDuration: duration,
        remainingTime: state.isRunning ? state.remainingTime : duration * 60,
      });

      if (state.currentSession) {
        set({
          currentSession: {
            ...state.currentSession,
            plannedDuration: duration,
          },
        });
      }
    },

    detectSystemSleep: () => {
      const state = get();
      const now = Date.now();
      const timeSinceLastActive = now - state.lastActiveTime;
      
      // If more than 2 minutes have passed, consider it a system sleep
      if (timeSinceLastActive > 120000 && state.isRunning && !state.isPaused) {
        set({
          isSystemSleepDetected: true,
          isPaused: true,
          lastTickTime: null,
        });
      }
    },

    updateLastActiveTime: () => {
      set({
        lastActiveTime: Date.now(),
        isSystemSleepDetected: false,
      });
    },

    updateSessionPreferences: (preferences) => {
      set({
        sessionPreferences: {
          ...get().sessionPreferences,
          ...preferences,
        },
      });
      
      // Save to localStorage for persistence
      localStorage.setItem('sessionPreferences', JSON.stringify(get().sessionPreferences));
    },

    resetTimer: () => {
      set(initialState);
    },

    // Helper methods (not part of the store interface but used internally)
    getDurationForSessionType: (sessionType: Session['sessionType']): number => {
      const prefs = get().sessionPreferences;
      switch (sessionType) {
        case 'deep_work':
          return prefs.deepWorkDuration;
        case 'quick_task':
          return prefs.quickTaskDuration;
        case 'break':
          return prefs.breakDuration;
        case 'custom':
          return prefs.customDuration;
        default:
          return prefs.deepWorkDuration;
      }
    },

    createSessionOnServer: async (session: Session) => {
      try {
        const result = await backgroundTimerClient.startTimer(
          session.sessionType,
          session.plannedDuration,
          session.taskId,
          session.categoryId
        );
        
        set({
          currentSession: {
            ...get().currentSession!,
            id: result.sessionId,
          },
        });
      } catch (error) {
        console.error('Failed to create session on server:', error);
      }
    },

    updateSessionOnServer: async (session: Session) => {
      try {
        if (session.completed) {
          await backgroundTimerClient.completeTimer(session.qualityRating, session.notes);
        } else {
          // For non-completed sessions (stopped), just stop the timer
          await backgroundTimerClient.stopTimer();
        }
      } catch (error) {
        console.error('Failed to update session on server:', error);
      }
    },

    // Task-session integration methods
    switchTask: async (taskId?: number) => {
      const state = get();
      if (!state.currentSession || !state.isRunning) return;

      // Calculate time spent on current task
      const currentDuration = Math.round((state.plannedDuration * 60 - state.remainingTime) / 60);
      
      // Update current task's actual duration if it exists
      if (state.currentSession.taskId && currentDuration > 0) {
        await get().updateTaskActualDuration(state.currentSession.taskId, currentDuration);
      }

      // Update current session with new task
      const updatedSession = {
        ...state.currentSession,
        taskId,
        // Reset start time for new task tracking
        startTime: new Date(),
      };

      set({
        currentSession: updatedSession,
      });

      // Update session on server
      await get().updateSessionOnServer(updatedSession);
    },

    completeCurrentTask: async () => {
      const state = get();
      if (!state.currentSession?.taskId) return;

      try {
        // Calculate final duration for the task
        const sessionDuration = Math.round((state.plannedDuration * 60 - state.remainingTime) / 60);
        
        // Update task's actual duration
        if (sessionDuration > 0) {
          await get().updateTaskActualDuration(state.currentSession.taskId, sessionDuration);
        }

        // Mark task as complete via API
        const response = await fetch(`http://localhost:8765/api/tasks/${state.currentSession.taskId}/complete`, {
          method: 'PATCH',
        });

        if (!response.ok) {
          throw new Error('Failed to complete task');
        }

        // Show success notification
        if (get().sessionPreferences.notificationsEnabled) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task Completed!', {
              body: `Task completed with ${sessionDuration} minutes of work`,
              icon: '/favicon.ico',
            });
          }
        }
      } catch (error) {
        console.error('Failed to complete task:', error);
        throw error;
      }
    },

    updateTaskActualDuration: async (taskId: number, additionalMinutes: number) => {
      try {
        const response = await fetch(`http://localhost:8765/api/tasks/${taskId}/add-time`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ additionalMinutes }),
        });

        if (!response.ok) {
          throw new Error('Failed to update task duration');
        }
      } catch (error) {
        console.error('Failed to update task actual duration:', error);
        // Don't throw here to avoid breaking the session flow
      }
    },

    showCompletionNotification: (session: Session) => {
      if (!get().sessionPreferences.notificationsEnabled) return;
      
      const message = `${session.sessionType.replace('_', ' ')} session completed! Duration: ${session.actualDuration} minutes`;
      
      // Use browser notification if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Session Complete', {
          body: message,
          icon: '/favicon.ico',
        });
      }
    },
  }))
);

// Load session preferences from localStorage on initialization
const savedPreferences = localStorage.getItem('sessionPreferences');
if (savedPreferences) {
  try {
    const preferences = JSON.parse(savedPreferences);
    useTimerStore.getState().updateSessionPreferences(preferences);
  } catch (error) {
    console.error('Failed to load session preferences:', error);
  }
}

// Backend timer synchronization - Listen for timer status updates from BackgroundTimerClient
// This ensures the frontend UI stays in sync with the backend timer service
if (typeof window !== 'undefined') {
  let syncInterval: number | null = null;

  // Listen for timer status updates from BackgroundTimerClient
  window.addEventListener('timerStatusUpdate', (event: CustomEvent) => {
    const status = event.detail;
    const currentState = useTimerStore.getState();

    console.log('🔄 Timer status update received:', status);

    // Only sync if we have valid status data from backend
    if (status && typeof status === 'object') {
      const { timerState, remainingTime, isIdle } = status;

      // If no active timer on backend, ensure frontend reflects stopped state
      if (!timerState && currentState.isRunning) {
        console.log('⏹️ Backend timer stopped, updating frontend');
        useTimerStore.setState({
          isRunning: false,
          isPaused: false,
          lastTickTime: null
        });
        return;
      }

      // Sync backend timer state with frontend
      if (timerState) {
        const { isRunning, isPaused, sessionType, plannedDuration } = timerState;

        // Update timer state if different from current
        const updates: Partial<TimerState> = {};

        if (isRunning !== currentState.isRunning) {
          updates.isRunning = isRunning;
          console.log(`🎯 Timer running state: ${isRunning}`);
        }

        if (isPaused !== currentState.isPaused) {
          updates.isPaused = isPaused;
          console.log(`⏸️ Timer paused state: ${isPaused}`);
        }

        // Update remaining time if backend provides it and timer is active and not paused
        if (remainingTime !== undefined && remainingTime >= 0 && isRunning && !isPaused) {
          updates.remainingTime = remainingTime;
          updates.lastTickTime = Date.now(); // Update tick time for smooth countdown
          console.log(`⏱️ Remaining time: ${remainingTime}s`);
        } else if (isPaused) {
          // When paused, stop the smooth countdown by clearing lastTickTime
          updates.lastTickTime = null;
          console.log(`⏸️ Timer paused, stopping countdown updates`);
        }

        // Sync session configuration if different
        if (sessionType && sessionType !== currentState.sessionType) {
          updates.sessionType = sessionType;
          console.log(`📝 Session type: ${sessionType}`);
        }

        if (plannedDuration !== undefined && plannedDuration !== currentState.plannedDuration) {
          updates.plannedDuration = plannedDuration;
          console.log(`⏰ Planned duration: ${plannedDuration}min`);
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          useTimerStore.setState(updates);
        }
      }
    }
  });

  // Error recovery with automatic retry
  let retryTimeout: number | null = null;
  let retryAttempts = 0;
  const maxRetryAttempts = 3;
  const retryDelays = [5000, 10000, 30000]; // 5s, 10s, 30s

  // Handle connection status events for error recovery
  window.addEventListener('timerConnectionLost', (event: CustomEvent) => {
    console.warn('⚠️ Timer connection lost:', event.detail.message);

    // Start automatic retry with exponential backoff
    if (retryAttempts < maxRetryAttempts) {
      const delay = retryDelays[Math.min(retryAttempts, retryDelays.length - 1)];
      console.log(`🔄 Will retry connection in ${delay / 1000}s (attempt ${retryAttempts + 1}/${maxRetryAttempts})`);

      retryTimeout = window.setTimeout(async () => {
        retryAttempts++;
        console.log(`🔄 Retry attempt ${retryAttempts}/${maxRetryAttempts}`);

        const success = await backgroundTimerClient.attemptReconnection();
        if (success) {
          retryAttempts = 0; // Reset on success
        }
      }, delay);
    }
  });

  window.addEventListener('timerConnectionRestored', (event: CustomEvent) => {
    console.log('🟢 Timer connection restored');

    // Clear any pending retry attempts
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    retryAttempts = 0;
  });

  window.addEventListener('timerConnectionFailed', (event: CustomEvent) => {
    console.error('❌ Timer connection failed permanently:', event.detail.message);

    // Clear retry attempts - user intervention required
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    retryAttempts = maxRetryAttempts;
  });

  // Start smooth countdown animation using optimistic updates
  // This provides 60fps smooth countdown while staying synced with backend
  const startSmoothCountdown = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
    }

    syncInterval = window.setInterval(() => {
      const state = useTimerStore.getState();

      // Only tick if timer is running and not paused and we have a valid lastTickTime
      if (state.isRunning && !state.isPaused && state.lastTickTime) {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - state.lastTickTime) / 1000);

        // Optimistic update: reduce time by 1 second for smooth animation
        if (deltaSeconds >= 1 && state.remainingTime > 0) {
          const newRemainingTime = Math.max(0, state.remainingTime - 1);

          useTimerStore.setState({
            remainingTime: newRemainingTime,
            lastTickTime: now
          });

          // Auto-complete when countdown reaches zero
          if (newRemainingTime === 0) {
            state.completeSession();
          }
        }
      } else if (state.isPaused && state.lastTickTime) {
        // Clear lastTickTime when paused to stop optimistic updates
        useTimerStore.setState({ lastTickTime: null });
      }
    }, 1000); // 1 second intervals for smooth countdown
  };

  // Subscribe to timer state changes to manage smooth countdown
  useTimerStore.subscribe(
    (state) => ({ isRunning: state.isRunning, isPaused: state.isPaused }),
    (current, previous) => {
      // Start smooth countdown when timer starts or resumes
      if (current.isRunning && !current.isPaused && (!previous.isRunning || previous.isPaused)) {
        startSmoothCountdown();
      }

      // Stop smooth countdown when timer stops or pauses
      if ((!current.isRunning || current.isPaused) && syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }
    }
  );
}