import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OnboardingState {
  // Onboarding completion status
  isCompleted: boolean;
  currentStep: number;
  totalSteps: number;
  
  // User preferences collected during onboarding
  preferences: {
    name?: string;
    primaryGoal: 'deep_work' | 'task_completion' | 'habit_building' | 'time_tracking';
    workStyle: 'focused_blocks' | 'flexible' | 'structured';
    preferredSessionLength: number; // in minutes
    dailyGoal: number; // in minutes
    weeklyGoal: number; // in minutes
    categories: Array<{
      name: string;
      color: string;
      icon: string;
      weeklyGoal: number;
    }>;
    notifications: {
      sessionComplete: boolean;
      breakReminders: boolean;
      dailyReview: boolean;
    };
  };
  
  // Actions
  setCurrentStep: (step: number) => void;
  updatePreferences: (preferences: Partial<OnboardingState['preferences']>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  skipOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state - start with completed for better UX
      isCompleted: true,
      currentStep: 0,
      totalSteps: 6,
      
      preferences: {
        primaryGoal: 'deep_work',
        workStyle: 'focused_blocks',
        preferredSessionLength: 25,
        dailyGoal: 120, // 2 hours
        weeklyGoal: 600, // 10 hours
        categories: [],
        notifications: {
          sessionComplete: true,
          breakReminders: true,
          dailyReview: true,
        },
      },
      
      // Actions
      setCurrentStep: (step: number) => {
        set({ currentStep: Math.max(0, Math.min(step, get().totalSteps)) });
      },
      
      updatePreferences: (newPreferences: Partial<OnboardingState['preferences']>) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        }));
      },
      
      completeOnboarding: () => {
        set({ 
          isCompleted: true,
          currentStep: get().totalSteps,
        });
      },
      
      resetOnboarding: () => {
        set({
          isCompleted: false,
          currentStep: 0,
          preferences: {
            primaryGoal: 'deep_work',
            workStyle: 'focused_blocks',
            preferredSessionLength: 25,
            dailyGoal: 120,
            weeklyGoal: 600,
            categories: [],
            notifications: {
              sessionComplete: true,
              breakReminders: true,
              dailyReview: true,
            },
          },
        });
      },
      
      skipOnboarding: () => {
        set({ 
          isCompleted: true,
          currentStep: get().totalSteps,
        });
      },
    }),
    {
      name: 'onboarding-storage',
      version: 1,
    }
  )
);