import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface WeeklyGoal {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  targetMinutes: number;
  currentMinutes: number;
  progressPercentage: number;
  isCompleted: boolean;
  weekStart: string;
  weekEnd: string;
}

export interface WeeklyGoalProgress {
  weekStart: string;
  weekEnd: string;
  totalTargetMinutes: number;
  totalCurrentMinutes: number;
  overallProgressPercentage: number;
  completedGoals: number;
  totalGoals: number;
  goals: WeeklyGoal[];
  dailyBreakdown: Array<{
    date: string;
    totalMinutes: number;
    categoryBreakdown: Array<{
      categoryId: number;
      categoryName: string;
      minutes: number;
    }>;
  }>;
}

export interface GoalAchievement {
  categoryId: number;
  categoryName: string;
  weekStart: string;
  achievedAt: Date;
  targetMinutes: number;
  actualMinutes: number;
  overachievementPercentage: number;
}

export interface GoalNeedingAttention {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  targetMinutes: number;
  currentMinutes: number;
  remainingMinutes: number;
  daysLeft: number;
  dailyTargetToMeetGoal: number;
  riskLevel: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface WeeklyGoalStatistics {
  averageCompletionRate: number;
  totalGoalsSet: number;
  totalGoalsAchieved: number;
  bestWeek: {
    weekStart: string;
    completionRate: number;
    totalMinutes: number;
  } | null;
  categoryPerformance: Array<{
    categoryId: number;
    categoryName: string;
    averageCompletion: number;
    weeksWithGoals: number;
    weeksCompleted: number;
  }>;
  weeklyTrend: Array<{
    weekStart: string;
    completionRate: number;
    totalMinutes: number;
    goalsCompleted: number;
    totalGoals: number;
  }>;
}

interface WeeklyGoalsState {
  // Current week progress
  currentWeekProgress: WeeklyGoalProgress | null;
  
  // Historical progress for specific weeks
  weeklyProgress: Map<string, WeeklyGoalProgress>;
  
  // Achievements
  achievements: GoalAchievement[];
  
  // Goals needing attention
  goalsNeedingAttention: GoalNeedingAttention[];
  
  // Statistics
  statistics: WeeklyGoalStatistics | null;
  
  // Loading states
  loading: {
    currentWeek: boolean;
    weekProgress: boolean;
    achievements: boolean;
    attention: boolean;
    statistics: boolean;
    updateGoal: boolean;
    celebration: boolean;
  };
  
  // Error state
  error: string | null;
  
  // Actions
  fetchCurrentWeekProgress: () => Promise<void>;
  fetchWeekProgress: (date: string) => Promise<void>;
  updateCategoryGoal: (categoryId: number, targetMinutes: number) => Promise<void>;
  fetchAchievements: (startDate: string, endDate: string) => Promise<void>;
  fetchGoalsNeedingAttention: () => Promise<void>;
  fetchStatistics: (weeks?: number) => Promise<void>;
  celebrateAchievement: (categoryId: number, weekStart: string) => Promise<{ message: string; milestone?: string }>;
  clearError: () => void;
}

const API_BASE = '/api/weekly-goals';

export const useWeeklyGoalsStore = create<WeeklyGoalsState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentWeekProgress: null,
      weeklyProgress: new Map(),
      achievements: [],
      goalsNeedingAttention: [],
      statistics: null,
      loading: {
        currentWeek: false,
        weekProgress: false,
        achievements: false,
        attention: false,
        statistics: false,
        updateGoal: false,
        celebration: false,
      },
      error: null,

      // Actions
      fetchCurrentWeekProgress: async () => {
        set((state) => ({
          loading: { ...state.loading, currentWeek: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/current`);
          if (!response.ok) {
            throw new Error('Failed to fetch current week progress');
          }

          const currentWeekProgress = await response.json();
          
          set((state) => ({
            currentWeekProgress,
            loading: { ...state.loading, currentWeek: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, currentWeek: false },
          }));
        }
      },

      fetchWeekProgress: async (date: string) => {
        set((state) => ({
          loading: { ...state.loading, weekProgress: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/week/${date}`);
          if (!response.ok) {
            throw new Error('Failed to fetch week progress');
          }

          const weekProgress = await response.json();
          
          set((state) => ({
            weeklyProgress: new Map(state.weeklyProgress).set(weekProgress.weekStart, weekProgress),
            loading: { ...state.loading, weekProgress: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, weekProgress: false },
          }));
        }
      },

      updateCategoryGoal: async (categoryId: number, targetMinutes: number) => {
        set((state) => ({
          loading: { ...state.loading, updateGoal: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/category/${categoryId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetMinutes }),
          });

          if (!response.ok) {
            throw new Error('Failed to update category goal');
          }

          // Refresh current week progress after updating goal
          await get().fetchCurrentWeekProgress();
          
          set((state) => ({
            loading: { ...state.loading, updateGoal: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, updateGoal: false },
          }));
        }
      },

      fetchAchievements: async (startDate: string, endDate: string) => {
        set((state) => ({
          loading: { ...state.loading, achievements: true },
          error: null,
        }));

        try {
          const response = await fetch(
            `${API_BASE}/achievements?startDate=${startDate}&endDate=${endDate}`
          );
          if (!response.ok) {
            throw new Error('Failed to fetch achievements');
          }

          const achievements = await response.json();
          
          // Convert achievedAt strings to Date objects
          const processedAchievements = achievements.map((achievement: any) => ({
            ...achievement,
            achievedAt: new Date(achievement.achievedAt)
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

      fetchGoalsNeedingAttention: async () => {
        set((state) => ({
          loading: { ...state.loading, attention: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/attention`);
          if (!response.ok) {
            throw new Error('Failed to fetch goals needing attention');
          }

          const goalsNeedingAttention = await response.json();
          
          set((state) => ({
            goalsNeedingAttention,
            loading: { ...state.loading, attention: false },
          }));
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, attention: false },
          }));
        }
      },

      fetchStatistics: async (weeks = 12) => {
        set((state) => ({
          loading: { ...state.loading, statistics: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/statistics?weeks=${weeks}`);
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

      celebrateAchievement: async (categoryId: number, weekStart: string) => {
        set((state) => ({
          loading: { ...state.loading, celebration: true },
          error: null,
        }));

        try {
          const response = await fetch(`${API_BASE}/celebrate/${categoryId}/${weekStart}`, {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Failed to celebrate achievement');
          }

          const celebration = await response.json();
          
          set((state) => ({
            loading: { ...state.loading, celebration: false },
          }));

          return {
            message: celebration.message,
            milestone: celebration.milestone
          };
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: { ...state.loading, celebration: false },
          }));
          return { message: 'Failed to celebrate achievement' };
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'weekly-goals-store',
    }
  )
);