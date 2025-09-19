import React, { useState, useEffect } from 'react';
import { BarChart3, Clock, Target, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { Category, ApiResponse } from '../../../../shared/types';

interface CategoryUsageStats extends Category {
  taskCount: number;
  totalSessionTime: number;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
}

interface CategoryUsageStatsProps {
  className?: string;
}

export const CategoryUsageStats: React.FC<CategoryUsageStatsProps> = ({
  className = '',
}) => {
  const [stats, setStats] = useState<CategoryUsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    fetchUsageStats();
  }, [timeFilter]);

  const fetchUsageStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/categories/usage-stats');
      const result: ApiResponse<CategoryUsageStats[]> = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch usage statistics');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  const getTotalStats = () => {
    return stats.reduce(
      (acc, stat) => ({
        totalTasks: acc.totalTasks + stat.taskCount,
        totalTime: acc.totalTime + stat.totalSessionTime,
        totalSessions: acc.totalSessions + stat.totalSessions,
        completedSessions: acc.completedSessions + stat.completedSessions,
      }),
      { totalTasks: 0, totalTime: 0, totalSessions: 0, completedSessions: 0 }
    );
  };

  const overallStats = getTotalStats();
  const overallCompletionRate = overallStats.totalSessions > 0
    ? (overallStats.completedSessions / overallStats.totalSessions) * 100
    : 0;

  const getMostActiveCategory = () => {
    return stats.reduce((max, current) =>
      current.totalSessionTime > max.totalSessionTime ? current : max,
      stats[0] || { name: 'N/A', totalSessionTime: 0 }
    );
  };

  const getMostProductiveCategory = () => {
    return stats.reduce((max, current) =>
      current.completionRate > max.completionRate ? current : max,
      stats[0] || { name: 'N/A', completionRate: 0 }
    );
  };

  if (error) {
    return (
      <div className={`p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md ${className}`}>
        <p className="text-red-800 dark:text-red-200">Error loading usage statistics: {error}</p>
        <button
          onClick={fetchUsageStats}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Category Usage Statistics</span>
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyze productivity patterns across your categories
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mt-4 sm:mt-0">
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              timeFilter === 'week'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              timeFilter === 'month'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              timeFilter === 'all'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {overallStats.totalTasks}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {formatTime(overallStats.totalTime)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sessions</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {overallStats.totalSessions}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {formatPercentage(overallCompletionRate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          {stats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">Most Active Category</h4>
                </div>
                <p className="text-blue-800 dark:text-blue-200">
                  <strong>{getMostActiveCategory().name}</strong> with {formatTime(getMostActiveCategory().totalSessionTime)} total time
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">Most Productive Category</h4>
                </div>
                <p className="text-green-800 dark:text-green-200">
                  <strong>{getMostProductiveCategory().name}</strong> with {formatPercentage(getMostProductiveCategory().completionRate)} completion rate
                </p>
              </div>
            </div>
          )}

          {/* Category Details */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
              Category Breakdown
            </h4>
            <div className="space-y-3">
              {stats.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No usage data available</p>
                  <p className="text-sm mt-1">Start using categories to see statistics here</p>
                </div>
              ) : (
                stats.map((category) => (
                  <div
                    key={category.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {category.name}
                        </h5>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {category.taskCount} task{category.taskCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Time Spent</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatTime(category.totalSessionTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Sessions</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {category.totalSessions}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Completed</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {category.completedSessions}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatPercentage(category.completionRate)}
                        </p>
                      </div>
                    </div>

                    {/* Progress towards weekly goal */}
                    {category.weeklyGoal > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Weekly Goal Progress</span>
                          <span>
                            {formatTime(category.totalSessionTime)} / {formatTime(category.weeklyGoal)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: category.color,
                              width: `${Math.min((category.totalSessionTime / category.weeklyGoal) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};