import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface FocusScoreBreakdown {
  date: string;
  totalScore: number;
  components: {
    timeScore: number;
    qualityScore: number;
    consistencyScore: number;
    goalScore: number;
  };
  details: {
    totalFocusTime: number;
    sessionsCompleted: number;
    averageQuality: number;
    streakDay: boolean;
    goalProgress: number;
  };
}

export interface HabitChain {
  startDate: string;
  endDate: string;
  days: Array<{
    date: string;
    hasActivity: boolean;
    focusScore: number;
    streakDay: boolean;
    totalMinutes: number;
    isToday: boolean;
    isWeekend: boolean;
  }>;
  streakCount: number;
  totalDays: number;
  completionRate: number;
}

export interface Achievement {
  id: string;
  type: 'streak' | 'focus_score' | 'goal' | 'consistency' | 'milestone';
  title: string;
  description: string;
  icon: string;
  earnedAt: Date;
  value: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category?: string;
}

export interface HabitStatistics {
  currentStreak: number;
  longestStreak: number;
  averageFocusScore: number;
  totalFocusDays: number;
  totalFocusTime: number;
  averageDailyTime: number;
  bestDay: {
    date: string;
    focusScore: number;
    totalMinutes: number;
  } | null;
  weeklyConsistency: number;
  monthlyTrend: Array<{
    month: string;
    averageScore: number;
    totalDays: number;
    totalMinutes: number;
  }>;
}

export interface FocusScoreTrend {
  date: string;
  focusScore: number;
  components: {
    timeScore: number;
    qualityScore: number;
    consistencyScore: number;
    goalScore: number;
  };
  totalMinutes: number;
  sessionsCompleted: number;
}

interface FocusScoreState {
  // Focus score data
  focusScoreBreakdown: FocusScoreBreakdown | null;
  
  // Habit chain visualization
  habitChain: HabitChain | null;
  
  // Statistics
  statistics: HabitStatistics | null;
  
  // Achievements
  achievements: Achievement[];
  
  // Trends
  trends: FocusScoreTrend[];
  
  // Loading states
  loading: {
    focusScore: boolean;
    habitChain: boolean;
    statistics: boolean;
    achievements: boolean;
    trends: boolean;
    updateAll: boolean;
  };
  
  // Error state
  error: string | null;
  
  // Actions
  calculateFocusScore: (date: string) => Promise<void>;
  generateHabitChain: (startDate: string, endDate: string) => Promise<void>;
  fetchStatistics: (days?: number) => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchTrends: (days?: number) => Promise<void>;
  updateAllFocusScores: () => Promise<void>;
  clearError: () => void;
}

const API_BASE = '/api/focus-score';

export const useFocusScoreStore = create<FocusScoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      focusScoreBreakdown: null,
      habitChain: null,
      statistics: null,
      achievements: [],
      trends: [],
      loading: {
        focusScore: false,
        habitChain: false,
        statistics: false,
        achievements: false,
        trends: false,
        updateAll: false,
      },
      error: null,

      // Actions
      calculateFocusScore: async (date: string) => {
        set((state) => ({
          loading: { ...state.loading, focusScore: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/calculate/${date}`);
          if (!response.ok) {
            throw new Error('Failed to calculate focus score');
          }

          const focusScoreBreakdown = await response.json();
          
          set((state) => ({
            focusScoreBreakdown,
            loading: { ...state.loading, focusScore: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, focusScore: false },
          }));
        }
      },

      generateHabitChain: async (startDate: string, endDate: string) => {
        set((state) => ({
          loading: { ...state.loading, habitChain: true },
          error: null,
        }));

        try {
          const response = await fetch(
            `${API_BASE}/habit-chain?startDate=${startDate}&endDate=${endDate}`
          );
          if (!response.ok) {
            throw new Error('Failed to generate habit chain');
          }

          const habitChain = await response.json();
          
          set((state) => ({
            habitChain,
            loading: { ...state.loading, habitChain: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, habitChain: false },
          }));
        }
      },

      fetchStatistics: async (days = 90) => {
        set((state) => ({
          loading: { ...state.loading, statistics: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/statistics?days=${days}`);
          if (!response.ok) {
            throw new Error('Failed to fetch statistics');
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

      fetchAchievements: async () => {
        set((state) => ({
          loading: { ...state.loading, achievements: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/achievements`);
          if (!response.ok) {
            throw new Error('Failed to fetch achievements');
          }

          const achievements = await response.json();
          
          // Convert earnedAt strings to Date objects
          const processedAchievements = achievements.map((achievement: any) => ({
            ...achievement,
            earnedAt: new Date(achievement.earnedAt)
          }));

          set((state) => ({
            achievements: processedAchievements,
            loading: { ...state.loading, achievements: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, achievements: false },
          }));
        }
      },

      fetchTrends: async (days = 30) => {
        set((state) => ({
          loading: { ...state.loading, trends: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/trends?days=${days}`);
          if (!response.ok) {
            throw new Error('Failed to fetch trends');
          }

          const trends = await response.json();
          
          set((state) => ({
            trends,
            loading: { ...state.loading, trends: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, trends: false },
          }));
        }
      },

      updateAllFocusScores: async () => {
        set((state) => ({
          loading: { ...state.loading, updateAll: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/update-all`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to update focus scores');
          }

          // Refresh statistics and trends after updating
          await get().fetchStatistics();
          await get().fetchTrends();
          
          set((state) => ({
            loading: { ...state.loading, updateAll: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, updateAll: false },
          }));
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'focus-score-store',
    }
  )
);