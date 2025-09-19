import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  streakDates: string[];
  lastStreakDate?: string;
  gracePeriodActive: boolean;
  gracePeriodEndsAt?: Date;
}

export interface StreakStatistics {
  totalStreakDays: number;
  streakPercentage: number;
  averageFocusTime: number;
  longestStreakInPeriod: number;
  streakDays: string[];
}

export interface StreakMilestone {
  milestone: number;
  daysToGo: number;
  description: string;
}

export interface StreakSettings {
  minimumFocusTime: number;
  gracePeriodDays: number;
  streakRecoveryEnabled: boolean;
}

interface StreakState {
  // Current streak information
  streakInfo: StreakInfo | null;
  
  // Statistics
  statistics: StreakStatistics | null;
  
  // Milestones
  milestones: StreakMilestone[];
  
  // Settings
  settings: StreakSettings | null;
  
  // Loading states
  loading: {
    streakInfo: boolean;
    statistics: boolean;
    milestones: boolean;
    settings: boolean;
    recovery: boolean;
  };
  
  // Error states
  error: string | null;
  
  // Actions
  fetchStreakInfo: () => Promise<void>;
  fetchStatistics: (startDate: string, endDate: string) => Promise<void>;
  fetchMilestones: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<StreakSettings>) => Promise<void>;
  recoverStreak: (date: string) => Promise<{ success: boolean; message: string }>;
  updateDailyStats: (date: string) => Promise<void>;
  clearError: () => void;
}

const API_BASE = '/api/streaks';

export const useStreakStore = create<StreakState>()(
  devtools(
    (set, get) => ({
      // Initial state
      streakInfo: null,
      statistics: null,
      milestones: [],
      settings: null,
      loading: {
        streakInfo: false,
        statistics: false,
        milestones: false,
        settings: false,
        recovery: false,
      },
      error: null,

      // Actions
      fetchStreakInfo: async () => {
        set((state) => ({
          loading: { ...state.loading, streakInfo: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/current`);
          if (!response.ok) {
            throw new Error('Failed to fetch streak info');
          }

          const streakInfo = await response.json();
          
          // Convert gracePeriodEndsAt to Date if it exists
          if (streakInfo.gracePeriodEndsAt) {
            streakInfo.gracePeriodEndsAt = new Date(streakInfo.gracePeriodEndsAt);
          }

          set((state) => ({
            streakInfo,
            loading: { ...state.loading, streakInfo: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, streakInfo: false },
          }));
        }
      },

      fetchStatistics: async (startDate: string, endDate: string) => {
        set((state) => ({
          loading: { ...state.loading, statistics: true },
          error: null,
        }));

        try {
          const response = await fetch(
            `${API_BASE}/statistics?startDate=${startDate}&endDate=${endDate}`
          );
          if (!response.ok) {
            throw new Error('Failed to fetch streak statistics');
          }

          const statistics = await response.json();
          set((state) => ({
            statistics,
            loading: { ...state.loading, statistics: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, statistics: false },
          }));
        }
      },

      fetchMilestones: async () => {
        set((state) => ({
          loading: { ...state.loading, milestones: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/milestones`);
          if (!response.ok) {
            throw new Error('Failed to fetch milestones');
          }

          const milestones = await response.json();
          set((state) => ({
            milestones,
            loading: { ...state.loading, milestones: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, milestones: false },
          }));
        }
      },

      fetchSettings: async () => {
        set((state) => ({
          loading: { ...state.loading, settings: true },
          error: null,
        }));

        try {
          // For now, we'll use default settings since we don't have a GET endpoint
          // This would typically fetch from /api/streaks/settings
          const defaultSettings: StreakSettings = {
            minimumFocusTime: 25,
            gracePeriodDays: 1,
            streakRecoveryEnabled: true,
          };

          set((state) => ({
            settings: defaultSettings,
            loading: { ...state.loading, settings: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, settings: false },
          }));
        }
      },

      updateSettings: async (newSettings: Partial<StreakSettings>) => {
        set((state) => ({
          loading: { ...state.loading, settings: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newSettings),
          });

          if (!response.ok) {
            throw new Error('Failed to update streak settings');
          }

          // Update local settings
          set((state) => ({
            settings: state.settings ? { ...state.settings, ...newSettings } : null,
            loading: { ...state.loading, settings: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, settings: false },
          }));
        }
      },

      recoverStreak: async (date: string) => {
        set((state) => ({
          loading: { ...state.loading, recovery: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/recover`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date }),
          });

          const result = await response.json();

          set((state) => ({
            loading: { ...state.loading, recovery: false },
          }));

          // Refresh streak info after recovery attempt
          if (result.success) {
            get().fetchStreakInfo();
          }

          return result;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, recovery: false },
          }));
          return { success: false, message: 'Failed to recover streak' };
        }
      },

      updateDailyStats: async (date: string) => {
        try {
          const response = await fetch(`${API_BASE}/update-daily/${date}`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to update daily stats');
          }

          // Refresh streak info after updating daily stats
          get().fetchStreakInfo();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'streak-store',
    }
  )
);