import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface MindfulnessState {
  // Active components
  showMindfulnessPrompt: boolean;
  showBreathingExercise: boolean;
  showTransitionAnimation: boolean;
  showSessionReflection: boolean;
  
  // Current states
  currentTransitionType: 'session_start' | 'session_end' | 'break_start' | 'break_end' | 'task_complete' | null;
  currentMindfulnessType: 'session_end' | 'session_start' | 'break_start' | 'manual';
  
  // Settings
  mindfulnessEnabled: boolean;
  transitionAnimationsEnabled: boolean;
  breathingExerciseEnabled: boolean;
  sessionReflectionEnabled: boolean;
  
  // Auto-trigger settings
  autoShowOnSessionEnd: boolean;
  autoShowOnSessionStart: boolean;
  autoShowOnBreakStart: boolean;
  
  // Statistics
  mindfulnessSessionsCompleted: number;
  totalMindfulnessTime: number; // seconds
  favoriteExercises: string[];
  streakDays: number;
  lastMindfulnessDate: Date | null;
}

export interface MindfulnessActions {
  // Component visibility
  showMindfulnessPromptModal: (type: MindfulnessState['currentMindfulnessType']) => void;
  hideMindfulnessPrompt: () => void;
  showBreathingExerciseModal: () => void;
  hideBreathingExercise: () => void;
  showTransitionAnimationModal: (type: MindfulnessState['currentTransitionType']) => void;
  hideTransitionAnimation: () => void;
  showSessionReflectionModal: () => void;
  hideSessionReflection: () => void;
  
  // Settings management
  updateMindfulnessSettings: (settings: Partial<Pick<MindfulnessState, 
    'mindfulnessEnabled' | 'transitionAnimationsEnabled' | 'breathingExerciseEnabled' | 
    'sessionReflectionEnabled' | 'autoShowOnSessionEnd' | 'autoShowOnSessionStart' | 'autoShowOnBreakStart'
  >>) => void;
  
  // Statistics tracking
  recordMindfulnessSession: (exerciseId: string, duration: number) => void;
  updateStreak: () => void;
  addFavoriteExercise: (exerciseId: string) => void;
  removeFavoriteExercise: (exerciseId: string) => void;
  
  // Auto-trigger logic
  checkAutoTriggers: (eventType: 'session_start' | 'session_end' | 'break_start' | 'break_end' | 'task_complete') => void;
  
  // Utility
  resetMindfulnessData: () => void;
  loadSettings: () => void;
  saveSettings: () => void;
}

export type MindfulnessStore = MindfulnessState & MindfulnessActions;

// Initial state
const initialState: MindfulnessState = {
  showMindfulnessPrompt: false,
  showBreathingExercise: false,
  showTransitionAnimation: false,
  showSessionReflection: false,
  currentTransitionType: null,
  currentMindfulnessType: 'manual',
  mindfulnessEnabled: true,
  transitionAnimationsEnabled: true,
  breathingExerciseEnabled: true,
  sessionReflectionEnabled: true,
  autoShowOnSessionEnd: true,
  autoShowOnSessionStart: false,
  autoShowOnBreakStart: true,
  mindfulnessSessionsCompleted: 0,
  totalMindfulnessTime: 0,
  favoriteExercises: [],
  streakDays: 0,
  lastMindfulnessDate: null,
};

export const useMindfulnessStore = create<MindfulnessStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Component visibility actions
    showMindfulnessPromptModal: (type) => {
      const state = get();
      if (!state.mindfulnessEnabled) return;
      
      set({
        showMindfulnessPrompt: true,
        currentMindfulnessType: type,
      });
    },

    hideMindfulnessPrompt: () => {
      set({
        showMindfulnessPrompt: false,
      });
    },

    showBreathingExerciseModal: () => {
      const state = get();
      if (!state.breathingExerciseEnabled) return;
      
      set({
        showBreathingExercise: true,
      });
    },

    hideBreathingExercise: () => {
      set({
        showBreathingExercise: false,
      });
    },

    showTransitionAnimationModal: (type) => {
      const state = get();
      if (!state.transitionAnimationsEnabled) return;
      
      set({
        showTransitionAnimation: true,
        currentTransitionType: type,
      });
    },

    hideTransitionAnimation: () => {
      set({
        showTransitionAnimation: false,
        currentTransitionType: null,
      });
    },

    showSessionReflectionModal: () => {
      const state = get();
      if (!state.sessionReflectionEnabled) return;
      
      set({
        showSessionReflection: true,
      });
    },

    hideSessionReflection: () => {
      set({
        showSessionReflection: false,
      });
    },

    // Settings management
    updateMindfulnessSettings: (settings) => {
      set(settings);
      get().saveSettings();
    },

    // Statistics tracking
    recordMindfulnessSession: (exerciseId, duration) => {
      set(state => ({
        mindfulnessSessionsCompleted: state.mindfulnessSessionsCompleted + 1,
        totalMindfulnessTime: state.totalMindfulnessTime + duration,
        lastMindfulnessDate: new Date(),
      }));
      
      // Update streak
      get().updateStreak();
      
      // Add to favorites if used multiple times
      const state = get();
      const exerciseCount = state.favoriteExercises.filter(id => id === exerciseId).length;
      if (exerciseCount >= 3 && !state.favoriteExercises.includes(exerciseId)) {
        get().addFavoriteExercise(exerciseId);
      }
      
      get().saveSettings();
    },

    updateStreak: () => {
      const state = get();
      const today = new Date();
      const lastDate = state.lastMindfulnessDate;
      
      if (!lastDate) {
        set({ streakDays: 1 });
        return;
      }
      
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day, no change to streak
        return;
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        set(state => ({ streakDays: state.streakDays + 1 }));
      } else {
        // Streak broken, reset to 1
        set({ streakDays: 1 });
      }
    },

    addFavoriteExercise: (exerciseId) => {
      set(state => ({
        favoriteExercises: [...state.favoriteExercises.filter(id => id !== exerciseId), exerciseId],
      }));
    },

    removeFavoriteExercise: (exerciseId) => {
      set(state => ({
        favoriteExercises: state.favoriteExercises.filter(id => id !== exerciseId),
      }));
    },

    // Auto-trigger logic
    checkAutoTriggers: (eventType) => {
      const state = get();
      
      if (!state.mindfulnessEnabled) return;
      
      switch (eventType) {
        case 'session_start':
          if (state.autoShowOnSessionStart) {
            // Show transition animation first, then mindfulness prompt
            get().showTransitionAnimationModal('session_start');
            setTimeout(() => {
              get().hideTransitionAnimation();
              get().showMindfulnessPromptModal('session_start');
            }, 3000);
          } else if (state.transitionAnimationsEnabled) {
            get().showTransitionAnimationModal('session_start');
            setTimeout(() => {
              get().hideTransitionAnimation();
            }, 3000);
          }
          break;
          
        case 'session_end':
          if (state.autoShowOnSessionEnd) {
            // Show transition animation first, then reflection or mindfulness
            get().showTransitionAnimationModal('session_end');
            setTimeout(() => {
              get().hideTransitionAnimation();
              if (state.sessionReflectionEnabled) {
                get().showSessionReflectionModal();
              } else {
                get().showMindfulnessPromptModal('session_end');
              }
            }, 3000);
          } else if (state.transitionAnimationsEnabled) {
            get().showTransitionAnimationModal('session_end');
            setTimeout(() => {
              get().hideTransitionAnimation();
            }, 3000);
          }
          break;
          
        case 'break_start':
          if (state.autoShowOnBreakStart) {
            get().showTransitionAnimationModal('break_start');
            setTimeout(() => {
              get().hideTransitionAnimation();
              get().showMindfulnessPromptModal('break_start');
            }, 3000);
          } else if (state.transitionAnimationsEnabled) {
            get().showTransitionAnimationModal('break_start');
            setTimeout(() => {
              get().hideTransitionAnimation();
            }, 3000);
          }
          break;
          
        case 'break_end':
          if (state.transitionAnimationsEnabled) {
            get().showTransitionAnimationModal('break_end');
            setTimeout(() => {
              get().hideTransitionAnimation();
            }, 3000);
          }
          break;
          
        case 'task_complete':
          if (state.transitionAnimationsEnabled) {
            get().showTransitionAnimationModal('task_complete');
            setTimeout(() => {
              get().hideTransitionAnimation();
            }, 3000);
          }
          break;
      }
    },

    // Utility functions
    resetMindfulnessData: () => {
      set({
        mindfulnessSessionsCompleted: 0,
        totalMindfulnessTime: 0,
        favoriteExercises: [],
        streakDays: 0,
        lastMindfulnessDate: null,
      });
      get().saveSettings();
    },

    loadSettings: () => {
      try {
        const saved = localStorage.getItem('mindfulnessSettings');
        if (saved) {
          const settings = JSON.parse(saved);
          set({
            ...settings,
            lastMindfulnessDate: settings.lastMindfulnessDate ? new Date(settings.lastMindfulnessDate) : null,
          });
        }
      } catch (error) {
        console.error('Failed to load mindfulness settings:', error);
      }
    },

    saveSettings: () => {
      try {
        const state = get();
        const settingsToSave = {
          mindfulnessEnabled: state.mindfulnessEnabled,
          transitionAnimationsEnabled: state.transitionAnimationsEnabled,
          breathingExerciseEnabled: state.breathingExerciseEnabled,
          sessionReflectionEnabled: state.sessionReflectionEnabled,
          autoShowOnSessionEnd: state.autoShowOnSessionEnd,
          autoShowOnSessionStart: state.autoShowOnSessionStart,
          autoShowOnBreakStart: state.autoShowOnBreakStart,
          mindfulnessSessionsCompleted: state.mindfulnessSessionsCompleted,
          totalMindfulnessTime: state.totalMindfulnessTime,
          favoriteExercises: state.favoriteExercises,
          streakDays: state.streakDays,
          lastMindfulnessDate: state.lastMindfulnessDate?.toISOString(),
        };
        
        localStorage.setItem('mindfulnessSettings', JSON.stringify(settingsToSave));
      } catch (error) {
        console.error('Failed to save mindfulness settings:', error);
      }
    },
  }))
);

// Load settings on initialization
useMindfulnessStore.getState().loadSettings();