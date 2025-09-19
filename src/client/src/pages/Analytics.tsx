import React, { useEffect } from 'react';
import { BarChart3, TrendingUp, Target, Calendar } from 'lucide-react';
import useAnalyticsStore from '../stores/analyticsStore';
import TimeDistributionChart from '../components/Analytics/TimeDistributionChart';
import DateRangePicker from '../components/Analytics/DateRangePicker';
import ExportButton from '../components/Analytics/ExportButton';
import ProductivityHeatmap from '../components/Analytics/ProductivityHeatmap';
import SessionLengthAnalysis from '../components/Analytics/SessionLengthAnalysis';
import SessionSuggestions from '../components/Analytics/SessionSuggestions';
import WeeklyMonthlyReports from '../components/Analytics/WeeklyMonthlyReports';
import FocusQualityMetrics from '../components/Analytics/FocusQualityMetrics';
import ComparativeAnalysis from '../components/Analytics/ComparativeAnalysis';
import GoalProgressVisualization from '../components/Analytics/GoalProgressVisualization';

const Analytics: React.FC = () => {
  const {
    timeDistribution,
    totalTime,
    timeDistributionTrends,
    productivityPatterns,
    sessionLengthAnalysis,
    productivityHeatmap,
    sessionSuggestions,
    goalProgress,
    weeklyMonthlyReports,
    focusQualityMetrics,
    comparativeAnalysis,
    startDate,
    endDate,
    isLoadingTimeDistribution,
    isLoadingProductivityPatterns,
    isLoadingSessionLengthAnalysis,
    isLoadingProductivityHeatmap,
    isLoadingSessionSuggestions,
    isLoadingGoalProgress,
    isLoadingReports,
    isLoadingFocusQuality,
    isLoadingComparative,
    timeDistributionError,
    productivityPatternsError,
    sessionLengthAnalysisError,
    productivityHeatmapError,
    sessionSuggestionsError,
    goalProgressError,
    reportsError,
    focusQualityError,
    comparativeError,
    setDateRange,
    fetchAllAnalytics,
    exportAnalyticsData,
    fetchComparativeAnalysis,
    clearErrors
  } = useAnalyticsStore();

  useEffect(() => {
    // Clear any previous errors and fetch initial data
    clearErrors();
    fetchAllAnalytics();
  }, [clearErrors, fetchAllAnalytics]);

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setDateRange(newStartDate, newEndDate);
  };

  const handleRefresh = () => {
    clearErrors();
    fetchAllAnalytics();
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const isAnyLoading = isLoadingTimeDistribution || isLoadingProductivityPatterns || isLoadingSessionLengthAnalysis || isLoadingProductivityHeatmap || isLoadingSessionSuggestions || isLoadingGoalProgress || isLoadingReports || isLoadingFocusQuality || isLoadingComparative;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Analytics Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Analyze your productivity patterns and track your progress over time
          </p>
        </div>

        {/* Date Range Picker */}
        <div className="mb-6">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={handleDateRangeChange}
            onRefresh={handleRefresh}
            isLoading={isAnyLoading}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Focus Time</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatTime(totalTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {timeDistribution.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Goals Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {goalProgress.filter(g => g.isCompleted).length}/{goalProgress.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Analytics Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Time Distribution Chart - Takes up 2 columns */}
          <div className="xl:col-span-2">
            <TimeDistributionChart
              data={timeDistribution}
              totalTime={totalTime}
              isLoading={isLoadingTimeDistribution}
              error={timeDistributionError}
              trendData={timeDistributionTrends}
            />
          </div>

          {/* Goal Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Goal Progress
            </h3>
            
            {isLoadingGoalProgress ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : goalProgressError ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400 mb-2">Error loading goals</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{goalProgressError}</p>
              </div>
            ) : goalProgress.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-2">No goals set</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Set weekly goals for your categories to track progress
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {goalProgress.map((goal) => (
                  <div key={goal.categoryId} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {goal.categoryName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(goal.currentProgress)} / {formatTime(goal.weeklyGoal)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          goal.isCompleted 
                            ? 'bg-green-500' 
                            : goal.percentage > 75 
                              ? 'bg-yellow-500' 
                              : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {goal.percentage.toFixed(1)}% complete
                      </span>
                      {goal.isCompleted && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✓ Goal achieved!
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Productivity Pattern Analysis Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Session Length Analysis */}
          <SessionLengthAnalysis
            data={sessionLengthAnalysis}
            isLoading={isLoadingSessionLengthAnalysis}
            error={sessionLengthAnalysisError}
          />

          {/* Session Suggestions */}
          <SessionSuggestions
            data={sessionSuggestions}
            isLoading={isLoadingSessionSuggestions}
            error={sessionSuggestionsError}
          />
        </div>

        {/* Productivity Heatmap - Full Width */}
        <div className="mb-8">
          <ProductivityHeatmap
            data={productivityHeatmap}
            isLoading={isLoadingProductivityHeatmap}
            error={productivityHeatmapError}
          />
        </div>

        {/* Weekly/Monthly Reports */}
        <div className="mb-8">
          <WeeklyMonthlyReports
            data={weeklyMonthlyReports}
            isLoading={isLoadingReports}
            error={reportsError}
            startDate={startDate}
            endDate={endDate}
          />
        </div>

        {/* Focus Quality Metrics */}
        <div className="mb-8">
          <FocusQualityMetrics
            data={focusQualityMetrics}
            isLoading={isLoadingFocusQuality}
            error={focusQualityError}
          />
        </div>

        {/* Comparative Analysis */}
        <div className="mb-8">
          <ComparativeAnalysis
            data={comparativeAnalysis}
            isLoading={isLoadingComparative}
            error={comparativeError}
            comparisonType="week"
            onComparisonTypeChange={(type) => fetchComparativeAnalysis(type)}
          />
        </div>

        {/* Goal Progress Visualization */}
        <div className="mb-8">
          <GoalProgressVisualization
            data={null} // TODO: Add to store
            isLoading={false}
            error={null}
          />
        </div>

        {/* Export Section */}
        <div className="mt-8">
          <ExportButton
            onExport={exportAnalyticsData}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>
    </div>
  );
};

export default Analytics;