import { create } from 'zustand';
import { TimeDistribution, ProductivityPattern, GoalProgress } from '../../../shared/types';

interface SessionLengthAnalysis {
  averageSessionLength: number;
  optimalSessionLength: number;
  sessionLengthDistribution: Array<{
    durationRange: string;
    count: number;
    averageQuality: number;
  }>;
  recommendations: string[];
}

interface ProductivityHeatmapData {
  dayOfWeek: number;
  hour: number;
  averageFocusTime: number;
  sessionCount: number;
  focusScore: number;
}

interface SessionSuggestions {
  suggestedDuration: number;
  confidence: number;
  reason: string;
  alternativeTimes: Array<{
    hour: number;
    dayOfWeek: number;
    score: number;
  }>;
}

interface AnalyticsState {
  // Time distribution data
  timeDistribution: TimeDistribution[];
  totalTime: number;
  
  // Time distribution trends (for line/area charts)
  timeDistributionTrends: Array<{
    date: string;
    [categoryName: string]: number | string;
  }>;
  
  // Productivity patterns
  productivityPatterns: ProductivityPattern[];
  
  // Session length analysis
  sessionLengthAnalysis: SessionLengthAnalysis | null;
  
  // Productivity heatmap
  productivityHeatmap: ProductivityHeatmapData[];
  
  // Session suggestions
  sessionSuggestions: SessionSuggestions | null;
  
  // Goal progress
  goalProgress: GoalProgress[];
  
  // New reporting features
  weeklyMonthlyReports: any;
  focusQualityMetrics: any;
  comparativeAnalysis: any;
  
  // Date range
  startDate: string;
  endDate: string;
  
  // Loading states
  isLoadingTimeDistribution: boolean;
  isLoadingProductivityPatterns: boolean;
  isLoadingSessionLengthAnalysis: boolean;
  isLoadingProductivityHeatmap: boolean;
  isLoadingSessionSuggestions: boolean;
  isLoadingGoalProgress: boolean;
  isLoadingReports: boolean;
  isLoadingFocusQuality: boolean;
  isLoadingComparative: boolean;
  
  // Error states
  timeDistributionError: string | null;
  productivityPatternsError: string | null;
  sessionLengthAnalysisError: string | null;
  productivityHeatmapError: string | null;
  sessionSuggestionsError: string | null;
  goalProgressError: string | null;
  reportsError: string | null;
  focusQualityError: string | null;
  comparativeError: string | null;
  
  // Actions
  setDateRange: (startDate: string, endDate: string) => void;
  fetchTimeDistribution: () => Promise<void>;
  fetchProductivityPatterns: () => Promise<void>;
  fetchSessionLengthAnalysis: () => Promise<void>;
  fetchProductivityHeatmap: () => Promise<void>;
  fetchSessionSuggestions: () => Promise<void>;
  fetchGoalProgress: () => Promise<void>;
  fetchAllAnalytics: () => Promise<void>;
  exportAnalyticsData: (format?: 'json' | 'csv') => Promise<void>;
  fetchTimeDistributionTrends: () => Promise<void>;
  clearErrors: () => void;
  
  // New reporting actions
  fetchReports: () => Promise<void>;
  fetchFocusQualityMetrics: () => Promise<void>;
  fetchComparativeAnalysis: (type: 'week' | 'month') => Promise<void>;
}

const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  // Initial state
  timeDistribution: [],
  totalTime: 0,
  timeDistributionTrends: [],
  productivityPatterns: [],
  sessionLengthAnalysis: null,
  productivityHeatmap: [],
  sessionSuggestions: null,
  goalProgress: [],
  weeklyMonthlyReports: null,
  focusQualityMetrics: null,
  comparativeAnalysis: null,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
  endDate: new Date().toISOString().split('T')[0], // today
  isLoadingTimeDistribution: false,
  isLoadingProductivityPatterns: false,
  isLoadingSessionLengthAnalysis: false,
  isLoadingProductivityHeatmap: false,
  isLoadingSessionSuggestions: false,
  isLoadingGoalProgress: false,
  isLoadingReports: false,
  isLoadingFocusQuality: false,
  isLoadingComparative: false,
  timeDistributionError: null,
  productivityPatternsError: null,
  sessionLengthAnalysisError: null,
  productivityHeatmapError: null,
  sessionSuggestionsError: null,
  goalProgressError: null,
  reportsError: null,
  focusQualityError: null,
  comparativeError: null,

  // Actions
  setDateRange: (startDate: string, endDate: string) => {
    set({ startDate, endDate });
  },

  fetchTimeDistribution: async () => {
    const { startDate, endDate } = get();
    set({ isLoadingTimeDistribution: true, timeDistributionError: null });
    
    try {
      const response = await fetch(
        `/api/analytics/time-distribution?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        // Provide fallback data for now
        set({
          timeDistribution: [],
          totalTime: 0,
          isLoadingTimeDistribution: false,
          timeDistributionError: `HTTP error! status: ${response.status}`
        });
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({
          timeDistribution: result.data.timeDistribution || [],
          totalTime: result.data.totalTime || 0,
          isLoadingTimeDistribution: false
        });
      } else {
        set({
          timeDistribution: [],
          totalTime: 0,
          isLoadingTimeDistribution: false,
          timeDistributionError: result.error?.message || 'Failed to fetch time distribution'
        });
      }
    } catch (error) {
      console.error('Error fetching time distribution:', error);
      set({
        timeDistribution: [],
        totalTime: 0,
        timeDistributionError: error instanceof Error ? error.message : 'Unknown error',
        isLoadingTimeDistribution: false
      });
    }
  },

  fetchProductivityPatterns: async () => {
    const { startDate, endDate } = get();
    set({ isLoadingProductivityPatterns: true, productivityPatternsError: null });
    
    try {
      const response = await fetch(
        `/api/analytics/productivity-patterns?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({
          productivityPatterns: result.data.patterns,
          isLoadingProductivityPatterns: false
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch productivity patterns');
      }
    } catch (error) {
      console.error('Error fetching productivity patterns:', error);
      set({
        productivityPatternsError: error instanceof Error ? error.message : 'Unknown error',
        isLoadingProductivityPatterns: false
      });
    }
  },

  fetchGoalProgress: async () => {
    const { startDate, endDate } = get();
    set({ isLoadingGoalProgress: true, goalProgressError: null });
    
    try {
      const response = await fetch(
        `/api/analytics/goal-progress?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        set({
          goalProgress: [],
          isLoadingGoalProgress: false,
          goalProgressError: `HTTP error! status: ${response.status}`
        });
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({
          goalProgress: result.data.goalProgress || [],
          isLoadingGoalProgress: false
        });
      } else {
        set({
          goalProgress: [],
          isLoadingGoalProgress: false,
          goalProgressError: result.error?.message || 'Failed to fetch goal progress'
        });
      }
    } catch (error) {
      console.error('Error fetching goal progress:', error);
      set({
        goalProgress: [],
        goalProgressError: error instanceof Error ? error.message : 'Unknown error',
        isLoadingGoalProgress: false
      });
    }
  },

  fetchSessionLengthAnalysis: async () => {
    const { startDate, endDate } = get();
    set({ isLoadingSessionLengthAnalysis: true, sessionLengthAnalysisError: null });
    
    try {
      const response = await fetch(
        `/api/analytics/session-length-analysis?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        set({
          sessionLengthAnalysis: null,
          isLoadingSessionLengthAnalysis: false,
          sessionLengthAnalysisError: `HTTP error! status: ${response.status}`
        });
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({
          sessionLengthAnalysis: result.data,
          isLoadingSessionLengthAnalysis: false
        });
      } else {
        set({
          sessionLengthAnalysis: null,
          isLoadingSessionLengthAnalysis: false,
          sessionLengthAnalysisError: result.error?.message || 'Failed to fetch session length analysis'
        });
      }
    } catch (error) {
      console.error('Error fetching session length analysis:', error);
      set({
        sessionLengthAnalysis: null,
        sessionLengthAnalysisError: error instanceof Error ? error.message : 'Unknown error',
        isLoadingSessionLengthAnalysis: false
      });
    }
  },

  fetchProductivityHeatmap: async () => {
    const { startDate, endDate } = get();
    set({ isLoadingProductivityHeatmap: true, productivityHeatmapError: null });
    
    try {
      const response = await fetch(
        `/api/analytics/productivity-heatmap?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({
          productivityHeatmap: result.data.heatmapData,
          isLoadingProductivityHeatmap: false
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch productivity heatmap');
      }
    } catch (error) {
      console.error('Error fetching productivity heatmap:', error);
      set({
        productivityHeatmapError: error instanceof Error ? error.message : 'Unknown error',
        isLoadingProductivityHeatmap: false
      });
    }
  },

  fetchSessionSuggestions: async () => {
    const { startDate, endDate } = get();
    set({ isLoadingSessionSuggestions: true, sessionSuggestionsError: null });
    
    try {
      const now = new Date();
      const response = await fetch(
        `/api/analytics/session-suggestions?hour=${now.getHours()}&dayOfWeek=${now.getDay()}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        set({
          sessionSuggestions: null,
          isLoadingSessionSuggestions: false,
          sessionSuggestionsError: `HTTP error! status: ${response.status}`
        });
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({
          sessionSuggestions: result.data,
          isLoadingSessionSuggestions: false
        });
      } else {
        set({
          sessionSuggestions: null,
          isLoadingSessionSuggestions: false,
          sessionSuggestionsError: result.error?.message || 'Failed to fetch session suggestions'
        });
      }
    } catch (error) {
      console.error('Error fetching session suggestions:', error);
      set({
        sessionSuggestions: null,
        sessionSuggestionsError: error instanceof Error ? error.message : 'Unknown error',
        isLoadingSessionSuggestions: false
      });
    }
  },

  fetchAllAnalytics: async () => {
    const { 
      fetchTimeDistribution, 
      fetchProductivityPatterns, 
      fetchSessionLengthAnalysis,
      fetchProductivityHeatmap,
      fetchSessionSuggestions,
      fetchGoalProgress, 
      fetchTimeDistributionTrends,
      fetchReports,
      fetchFocusQualityMetrics,
      fetchComparativeAnalysis
    } = get();
    
    await Promise.all([
      fetchTimeDistribution(),
      fetchProductivityPatterns(),
      fetchSessionLengthAnalysis(),
      fetchProductivityHeatmap(),
      fetchSessionSuggestions(),
      fetchGoalProgress(),
      fetchTimeDistributionTrends(), // This won't fail the whole operation if it errors
      fetchReports(),
      fetchFocusQualityMetrics(),
      fetchComparativeAnalysis('week')
    ]);
  },

  fetchTimeDistributionTrends: async () => {
    const { startDate, endDate } = get();
    
    try {
      const response = await fetch(
        `/api/analytics/time-distribution-trends?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({ timeDistributionTrends: result.data.trends });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch time distribution trends');
      }
    } catch (error) {
      console.error('Error fetching time distribution trends:', error);
      // Don't set error state for trends as it's optional
    }
  },

  exportAnalyticsData: async (format: 'json' | 'csv' = 'json') => {
    const { startDate, endDate } = get();
    
    try {
      const response = await fetch(
        `/api/analytics/export?startDate=${startDate}&endDate=${endDate}&format=${format}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${startDate}-${endDate}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  },

  clearErrors: () => {
    set({
      timeDistributionError: null,
      productivityPatternsError: null,
      sessionLengthAnalysisError: null,
      productivityHeatmapError: null,
      sessionSuggestionsError: null,
      goalProgressError: null,
      reportsError: null,
      focusQualityError: null,
      comparativeError: null
    });
  },

  fetchReports: async () => {
    const { startDate, endDate } = get();
    set({ isLoadingReports: true, reportsError: null });
    
    try {
      const response = await fetch(
        `/api/analytics/reports?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({
          weeklyMonthlyReports: result.data,
          isLoadingReports: false
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      set({
        reportsError: error instanceof Error ? error.message : 'Unknown error',
        isLoadingReports: false
      });
    }
  },

  fetchFocusQualityMetrics: async () => {
    const { startDate, endDate } = get();
    set({ isLoadingFocusQuality: true, focusQualityError: null });
    
    try {
      const response = await fetch(
        `/api/analytics/focus-quality?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({
          focusQualityMetrics: result.data,
          isLoadingFocusQuality: false
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch focus quality metrics');
      }
    } catch (error) {
      console.error('Error fetching focus quality metrics:', error);
      set({
        focusQualityError: error instanceof Error ? error.message : 'Unknown error',
        isLoadingFocusQuality: false
      });
    }
  },

  fetchComparativeAnalysis: async (type: 'week' | 'month') => {
    const { startDate, endDate } = get();
    set({ isLoadingComparative: true, comparativeError: null });
    
    try {
      const response = await fetch(
        `/api/analytics/comparative?type=${type}&startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        set({
          comparativeAnalysis: result.data,
          isLoadingComparative: false
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch comparative analysis');
      }
    } catch (error) {
      console.error('Error fetching comparative analysis:', error);
      set({
        comparativeError: error instanceof Error ? error.message : 'Unknown error',
        isLoadingComparative: false
      });
    }
  }
}));

export default useAnalyticsStore;