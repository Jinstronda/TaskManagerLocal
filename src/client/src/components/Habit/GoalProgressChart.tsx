import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Calendar, Clock } from 'lucide-react';
import { useWeeklyGoalsStore } from '../../stores/weeklyGoalsStore';

interface GoalProgressChartProps {
  className?: string;
  showWeeklyTrend?: boolean;
}

/**
 * GoalProgressChart Component
 * 
 * Visualizes weekly goal progress with interactive charts.
 * Shows current week progress and optional weekly trend data.
 * Provides detailed tooltips and progress indicators.
 */
export const GoalProgressChart: React.FC<GoalProgressChartProps> = ({
  className = '',
  showWeeklyTrend = false
}) => {
  const {
    currentWeekProgress,
    statistics,
    loading,
    error,
    fetchCurrentWeekProgress,
    fetchStatistics,
    clearError
  } = useWeeklyGoalsStore();

  useEffect(() => {
    fetchCurrentWeekProgress();
    if (showWeeklyTrend) {
      fetchStatistics(8); // Last 8 weeks
    }
  }, [fetchCurrentWeekProgress, fetchStatistics, showWeeklyTrend]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#10b981'; // green-500
    if (percentage >= 75) return '#3b82f6';  // blue-500
    if (percentage >= 50) return '#f59e0b';  // yellow-500
    return '#6b7280'; // gray-500
  };

  // Prepare current week data for chart
  const currentWeekData = currentWeekProgress?.goals.map(goal => ({
    name: goal.categoryName,
    current: goal.currentMinutes,
    target: goal.targetMinutes,
    percentage: goal.progressPercentage,
    color: goal.categoryColor,
    completed: goal.isCompleted
  })) || [];

  // Prepare weekly trend data
  const weeklyTrendData = statistics?.weeklyTrend.map(week => ({
    week: new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    completionRate: week.completionRate,
    totalMinutes: week.totalMinutes,
    goalsCompleted: week.goalsCompleted,
    totalGoals: week.totalGoals
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Current:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatTime(data.current)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Target:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatTime(data.target)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Progress:</span>
              <span className={`font-medium ${data.completed ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                {Math.round(data.percentage)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const TrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 dark:text-white mb-2">Week of {label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.round(data.completionRate)}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Total Time:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatTime(data.totalMinutes)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600 dark:text-gray-400">Goals:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data.goalsCompleted}/{data.totalGoals}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading.currentWeek || (showWeeklyTrend && loading.statistics)) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <TrendingUp className="w-5 h-5" />
          <span className="font-medium">Error Loading Chart</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={() => {
            clearError();
            fetchCurrentWeekProgress();
            if (showWeeklyTrend) fetchStatistics(8);
          }}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Current Week Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Current Week Progress
          </h3>
        </div>

        {currentWeekData.length > 0 ? (
          <>
            {/* Summary Stats */}
            {currentWeekProgress && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentWeekProgress.completedGoals}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Goals Completed
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(currentWeekProgress.overallProgressPercentage)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Overall Progress
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatTime(currentWeekProgress.totalCurrentMinutes)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Time Logged
                  </div>
                </div>
              </div>
            )}

            {/* Progress Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentWeekData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    tickFormatter={(value) => `${Math.round(value / 60)}h`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="current" radius={[4, 4, 0, 0]}>
                    {currentWeekData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getProgressColor(entry.percentage)} />
                    ))}
                  </Bar>
                  <Bar dataKey="target" fill="#e5e7eb" opacity={0.3} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Goals This Week
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Set some weekly goals to see your progress here.
            </p>
          </div>
        )}
      </div>

      {/* Weekly Trend */}
      {showWeeklyTrend && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Weekly Trend
            </h3>
          </div>

          {weeklyTrendData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="week" 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fill: '#6b7280' }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<TrendTooltip />} />
                  <Bar 
                    dataKey="completionRate" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Trend Data
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Complete some weekly goals to see trends over time.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalProgressChart;