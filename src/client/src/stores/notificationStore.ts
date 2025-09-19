import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  NotificationPreferences, 
  BreakSuggestion, 
  ReviewPrompt, 
  ReviewResponse,
  ReviewQuestion 
} from '../../../shared/types';

export interface NotificationState {
  // Preferences
  preferences: NotificationPreferences;
  
  // Active notifications
  activeBreakSuggestion: BreakSuggestion | null;
  activeReviewPrompt: ReviewPrompt | null;
  
  // Notification history
  dismissedSuggestions: string[];
  snoozedUntil: number | null; // timestamp
  
  // Review scheduling
  nextDailyReview: Date | null;
  nextWeeklyReview: Date | null;
  
  // Break tracking
  lastBreakTime: number | null; // timestamp
  sessionsSinceLastBreak: number;
  totalWorkTimeSinceBreak: number; // minutes
}

export interface NotificationActions {
  // Preferences management
  updatePreferences: (preferences: NotificationPreferences) => Promise<void>;
  loadPreferences: () => Promise<void>;
  
  // Break suggestions
  showBreakSuggestion: (suggestion: BreakSuggestion) => void;
  dismissBreakSuggestion: () => void;
  snoozeBreakSuggestion: (minutes: number) => void;
  acceptBreakSuggestion: (duration: number) => void;
  
  // Review prompts
  showReviewPrompt: (prompt: ReviewPrompt) => void;
  dismissReviewPrompt: () => void;
  snoozeReviewPrompt: (minutes: number) => void;
  submitReviewResponse: (response: ReviewResponse) => Promise<void>;
  
  // Break tracking
  recordBreakTaken: () => void;
  incrementSessionCount: () => void;
  addWorkTime: (minutes: number) => void;
  
  // Smart suggestions
  checkForBreakSuggestion: () => void;
  scheduleNextReviews: () => void;
  
  // Utility
  canShowNotification: (type: keyof NotificationPreferences) => boolean;
  isInFocusMode: () => boolean;
  clearSnoozedState: () => void;
}

export type NotificationStore = NotificationState & NotificationActions;

// Default notification preferences
const defaultPreferences: NotificationPreferences = {
  enabled: true,
  sessionComplete: {
    enabled: true,
    sound: true,
    duration: 10,
    showTaskInfo: true,
  },
  breakReminders: {
    enabled: true,
    sound: true,
    frequency: 'smart',
    duration: 15,
    smartThreshold: 90,
  },
  dailyReview: {
    enabled: true,
    time: '18:00',
    sound: false,
    weekendsIncluded: false,
  },
  weeklyReview: {
    enabled: true,
    dayOfWeek: 0, // Sunday
    time: '19:00',
    sound: false,
  },
  goalAchievements: {
    enabled: true,
    sound: true,
    showProgress: true,
  },
  streakMilestones: {
    enabled: true,
    sound: true,
    milestones: [7, 14, 30, 60, 100],
  },
  idleDetection: {
    enabled: true,
    threshold: 5,
    sound: false,
  },
  systemSleep: {
    enabled: true,
    sound: true,
  },
  focusMode: {
    suppressOtherNotifications: true,
    allowBreakReminders: true,
    allowUrgentOnly: false,
  },
};

// Initial state
const initialState: NotificationState = {
  preferences: defaultPreferences,
  activeBreakSuggestion: null,
  activeReviewPrompt: null,
  dismissedSuggestions: [],
  snoozedUntil: null,
  nextDailyReview: null,
  nextWeeklyReview: null,
  lastBreakTime: null,
  sessionsSinceLastBreak: 0,
  totalWorkTimeSinceBreak: 0,
};

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Preferences management
    updatePreferences: async (preferences: NotificationPreferences) => {
      try {
        // Save to server
        const response = await fetch('http://localhost:8765/api/settings/notification-preferences', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferences),
        });

        if (!response.ok) {
          throw new Error('Failed to save notification preferences');
        }

        set({ preferences });
        
        // Reschedule reviews if timing changed
        get().scheduleNextReviews();
        
        // Save to localStorage as backup
        localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      } catch (error) {
        console.error('Failed to update notification preferences:', error);
        throw error;
      }
    },

    loadPreferences: async () => {
      try {
        // Try to load from server first
        const response = await fetch('http://localhost:8765/api/settings/notification-preferences');
        
        if (response.ok) {
          const preferences = await response.json();
          set({ preferences });
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('notificationPreferences');
          if (saved) {
            const preferences = JSON.parse(saved);
            set({ preferences });
          }
        }
        
        // Schedule reviews after loading preferences
        get().scheduleNextReviews();
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
        // Use defaults if loading fails
      }
    },

    // Break suggestions
    showBreakSuggestion: (suggestion: BreakSuggestion) => {
      const state = get();
      
      // Don't show if notifications disabled or in focus mode without break reminders
      if (!state.canShowNotification('breakReminders')) {
        return;
      }
      
      // Don't show if snoozed
      if (state.snoozedUntil && Date.now() < state.snoozedUntil) {
        return;
      }
      
      set({ activeBreakSuggestion: suggestion });
    },

    dismissBreakSuggestion: () => {
      const state = get();
      if (state.activeBreakSuggestion) {
        set({
          activeBreakSuggestion: null,
          dismissedSuggestions: [
            ...state.dismissedSuggestions,
            `${state.activeBreakSuggestion.type}_${Date.now()}`,
          ],
        });
      }
    },

    snoozeBreakSuggestion: (minutes: number) => {
      set({
        activeBreakSuggestion: null,
        snoozedUntil: Date.now() + (minutes * 60 * 1000),
      });
    },

    acceptBreakSuggestion: (duration: number) => {
      // Start a break session
      // This would integrate with the timer store to start a break
      set({ activeBreakSuggestion: null });
      get().recordBreakTaken();
      
      // Trigger break session start (would integrate with timer store)
      // timerStore.startTimer('break', duration);
    },

    // Review prompts
    showReviewPrompt: (prompt: ReviewPrompt) => {
      const state = get();
      
      // Don't show if notifications disabled
      if (!state.preferences.enabled) {
        return;
      }
      
      // Check specific review type preferences
      if (prompt.type === 'daily' && !state.preferences.dailyReview.enabled) {
        return;
      }
      
      if (prompt.type === 'weekly' && !state.preferences.weeklyReview.enabled) {
        return;
      }
      
      set({ activeReviewPrompt: prompt });
    },

    dismissReviewPrompt: () => {
      set({ activeReviewPrompt: null });
    },

    snoozeReviewPrompt: (minutes: number) => {
      const state = get();
      set({ activeReviewPrompt: null });
      
      // Reschedule the review
      if (state.activeReviewPrompt?.type === 'daily') {
        const nextTime = new Date(Date.now() + (minutes * 60 * 1000));
        set({ nextDailyReview: nextTime });
      } else if (state.activeReviewPrompt?.type === 'weekly') {
        const nextTime = new Date(Date.now() + (minutes * 60 * 1000));
        set({ nextWeeklyReview: nextTime });
      }
    },

    submitReviewResponse: async (response: ReviewResponse) => {
      try {
        // Save review response to server
        const apiResponse = await fetch('http://localhost:8765/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(response),
        });

        if (!apiResponse.ok) {
          throw new Error('Failed to save review response');
        }

        set({ activeReviewPrompt: null });
        
        // Schedule next review
        get().scheduleNextReviews();
      } catch (error) {
        console.error('Failed to submit review response:', error);
        throw error;
      }
    },

    // Break tracking
    recordBreakTaken: () => {
      set({
        lastBreakTime: Date.now(),
        sessionsSinceLastBreak: 0,
        totalWorkTimeSinceBreak: 0,
      });
    },

    incrementSessionCount: () => {
      set(state => ({
        sessionsSinceLastBreak: state.sessionsSinceLastBreak + 1,
      }));
    },

    addWorkTime: (minutes: number) => {
      set(state => ({
        totalWorkTimeSinceBreak: state.totalWorkTimeSinceBreak + minutes,
      }));
    },

    // Smart suggestions
    checkForBreakSuggestion: () => {
      const state = get();
      
      if (!state.canShowNotification('breakReminders') || state.activeBreakSuggestion) {
        return;
      }
      
      const { preferences, sessionsSinceLastBreak, totalWorkTimeSinceBreak } = state;
      const breakPrefs = preferences.breakReminders;
      
      let shouldSuggestBreak = false;
      let suggestion: BreakSuggestion | null = null;
      
      // Time-based suggestion
      if (totalWorkTimeSinceBreak >= 120) { // 2 hours
        shouldSuggestBreak = true;
        suggestion = {
          type: 'time_based',
          reason: `You've been working for ${Math.round(totalWorkTimeSinceBreak)} minutes. Time for a break!`,
          suggestedDuration: 15,
          confidence: 0.9,
          sessionsSinceLastBreak,
          totalWorkTime: totalWorkTimeSinceBreak,
        };
      }
      
      // Frequency-based suggestion
      else if (breakPrefs.frequency !== 'smart') {
        const threshold = breakPrefs.frequency === 'after_each' ? 1 : 
                         breakPrefs.frequency === 'after_2' ? 2 : 3;
        
        if (sessionsSinceLastBreak >= threshold) {
          shouldSuggestBreak = true;
          suggestion = {
            type: 'pattern_based',
            reason: `You've completed ${sessionsSinceLastBreak} sessions. Consider taking a break.`,
            suggestedDuration: 10,
            confidence: 0.8,
            sessionsSinceLastBreak,
            totalWorkTime: totalWorkTimeSinceBreak,
          };
        }
      }
      
      // Smart suggestion
      else if (breakPrefs.frequency === 'smart' && totalWorkTimeSinceBreak >= breakPrefs.smartThreshold) {
        shouldSuggestBreak = true;
        suggestion = {
          type: 'productivity_based',
          reason: 'Based on your patterns, a break now could improve your focus.',
          suggestedDuration: Math.min(20, Math.round(totalWorkTimeSinceBreak / 6)),
          confidence: 0.75,
          sessionsSinceLastBreak,
          totalWorkTime: totalWorkTimeSinceBreak,
        };
      }
      
      if (shouldSuggestBreak && suggestion) {
        get().showBreakSuggestion(suggestion);
      }
    },

    scheduleNextReviews: () => {
      const { preferences } = get();
      const now = new Date();
      
      // Schedule daily review
      if (preferences.dailyReview.enabled) {
        const [hours, minutes] = preferences.dailyReview.time.split(':').map(Number);
        const nextDaily = new Date();
        nextDaily.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (nextDaily <= now) {
          nextDaily.setDate(nextDaily.getDate() + 1);
        }
        
        // Skip weekends if not included
        if (!preferences.dailyReview.weekendsIncluded) {
          while (nextDaily.getDay() === 0 || nextDaily.getDay() === 6) {
            nextDaily.setDate(nextDaily.getDate() + 1);
          }
        }
        
        set({ nextDailyReview: nextDaily });
      }
      
      // Schedule weekly review
      if (preferences.weeklyReview.enabled) {
        const [hours, minutes] = preferences.weeklyReview.time.split(':').map(Number);
        const nextWeekly = new Date();
        nextWeekly.setHours(hours, minutes, 0, 0);
        
        // Find next occurrence of the specified day
        const targetDay = preferences.weeklyReview.dayOfWeek;
        const currentDay = nextWeekly.getDay();
        const daysUntilTarget = (targetDay - currentDay + 7) % 7;
        
        if (daysUntilTarget === 0 && nextWeekly <= now) {
          // Same day but time has passed, schedule for next week
          nextWeekly.setDate(nextWeekly.getDate() + 7);
        } else {
          nextWeekly.setDate(nextWeekly.getDate() + daysUntilTarget);
        }
        
        set({ nextWeeklyReview: nextWeekly });
      }
    },

    // Utility functions
    canShowNotification: (type: keyof NotificationPreferences) => {
      const state = get();
      
      if (!state.preferences.enabled) {
        return false;
      }
      
      // Check if in focus mode
      if (state.isInFocusMode()) {
        const focusMode = state.preferences.focusMode;
        
        if (focusMode.suppressOtherNotifications) {
          // Only allow break reminders if explicitly allowed
          if (type === 'breakReminders' && !focusMode.allowBreakReminders) {
            return false;
          }
          
          // Block non-urgent notifications
          if (!focusMode.allowUrgentOnly && type !== 'breakReminders') {
            return false;
          }
        }
      }
      
      // Check specific type preferences
      const typePrefs = state.preferences[type];
      if (typeof typePrefs === 'object' && 'enabled' in typePrefs) {
        return typePrefs.enabled;
      }
      
      return true;
    },

    isInFocusMode: () => {
      // This would integrate with timer store to check if a focus session is active
      // For now, return false as placeholder
      return false;
    },

    clearSnoozedState: () => {
      set({ snoozedUntil: null });
    },
  }))
);

// Load preferences on store initialization
useNotificationStore.getState().loadPreferences();

// Set up periodic checks for scheduled reviews
setInterval(() => {
  const state = useNotificationStore.getState();
  const now = new Date();
  
  // Check for daily review
  if (state.nextDailyReview && now >= state.nextDailyReview) {
    const dailyPrompt: ReviewPrompt = {
      type: 'daily',
      title: 'Daily Reflection',
      questions: [
        {
          id: 'productivity_rating',
          type: 'rating',
          question: 'How would you rate your productivity today?',
          required: true,
        },
        {
          id: 'accomplishments',
          type: 'text',
          question: 'What did you accomplish today?',
          required: false,
        },
        {
          id: 'challenges',
          type: 'text',
          question: 'What challenges did you face?',
          required: false,
        },
        {
          id: 'tomorrow_focus',
          type: 'text',
          question: 'What will you focus on tomorrow?',
          required: false,
        },
      ],
    };
    
    state.showReviewPrompt(dailyPrompt);
  }
  
  // Check for weekly review
  if (state.nextWeeklyReview && now >= state.nextWeeklyReview) {
    const weeklyPrompt: ReviewPrompt = {
      type: 'weekly',
      title: 'Weekly Review',
      questions: [
        {
          id: 'week_rating',
          type: 'rating',
          question: 'How would you rate this week overall?',
          required: true,
        },
        {
          id: 'goals_achieved',
          type: 'yes_no',
          question: 'Did you achieve your main goals this week?',
          required: true,
        },
        {
          id: 'biggest_win',
          type: 'text',
          question: 'What was your biggest win this week?',
          required: false,
        },
        {
          id: 'improvement_area',
          type: 'text',
          question: 'What area would you like to improve next week?',
          required: false,
        },
        {
          id: 'next_week_goals',
          type: 'text',
          question: 'What are your main goals for next week?',
          required: false,
        },
      ],
    };
    
    state.showReviewPrompt(weeklyPrompt);
  }
  
  // Clear snoozed state if expired
  if (state.snoozedUntil && Date.now() >= state.snoozedUntil) {
    state.clearSnoozedState();
  }
}, 60000); // Check every minute