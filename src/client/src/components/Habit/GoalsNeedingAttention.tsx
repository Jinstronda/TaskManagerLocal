import React, { useEffect } from 'react';
import { AlertTriangle, Clock, TrendingDown, Target } from 'lucide-react';
import { useWeeklyGoalsStore } from '../../stores/weeklyGoalsStore';

interface GoalsNeedingAttentionProps {
  className?: string;
}

/**
 * GoalsNeedingAttention Component
 * 
 * Displays goals that need attention based on progress and time remaining.
 * Shows risk levels, suggestions, and actionable recommendations.
 * Helps users prioritize their focus to meet weekly goals.
 */
export const GoalsNeedingAttention: React.FC<GoalsNeedingAttentionProps> = ({
  className = ''
}) => {
  const {
    goalsNeedingAttention,
    loading,
    error,
    fetchGoalsNeedingAttention,
    clearError
  } = useWeeklyGoalsStore();

  useEffect(() => {
    fetchGoalsNeedingAttention();
  }, [fetchGoalsNeedingAttention]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: 'text-red-500'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-700 dark:text-yellow-300',
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          icon: 'text-yellow-500'
        };
      case 'low':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: 'text-blue-500'
        };
    }
  };

  const getRiskIcon = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <Clock className="w-5 h-5" />;
      case 'low':
        return <TrendingDown className="w-5 h-5" />;
    }
  };

  if (loading.attention) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
              </div>
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Error Loading Goals</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={() => {
            clearError();
            fetchGoalsNeedingAttention();
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Goals Needing Attention
        </h3>
        {goalsNeedingAttention.length > 0 && (
          <span className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 text-xs font-medium px-2 py-1 rounded-full">
            {goalsNeedingAttention.length}
          </span>
        )}
      </div>

      {/* Goals List */}
      {goalsNeedingAttention.length > 0 ? (
        <div className="space-y-4">
          {goalsNeedingAttention.map((goal) => {
            const colors = getRiskColor(goal.riskLevel);
            const progressPercentage = (goal.currentMinutes / goal.targetMinutes) * 100;
            
            return (
              <div
                key={goal.categoryId}
                className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: goal.categoryColor }}
                    ></div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {goal.categoryName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.badge}`}>
                          {goal.riskLevel.toUpperCase()} RISK
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {goal.daysLeft} {goal.daysLeft === 1 ? 'day' : 'days'} left
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`${colors.icon}`}>
                    {getRiskIcon(goal.riskLevel)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span>{formatTime(goal.currentMinutes)} / {formatTime(goal.targetMinutes)}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        goal.riskLevel === 'high' ? 'bg-red-500' :
                        goal.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, progressPercentage)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Goal Details */}
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Remaining: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatTime(goal.remainingMinutes)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Daily target: </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatTime(goal.dailyTargetToMeetGoal)}
                    </span>
                  </div>
                </div>

                {/* Suggestion */}
                <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                  <div className="flex items-start gap-2">
                    <Target className={`w-4 h-4 mt-0.5 ${colors.icon}`} />
                    <div>
                      <p className={`text-sm font-medium ${colors.text} mb-1`}>
                        Recommendation:
                      </p>
                      <p className={`text-sm ${colors.text}`}>
                        {goal.suggestion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto mb-4">
            <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            All Goals on Track! 🎯
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Great job! All your weekly goals are progressing well. Keep up the excellent work!
          </p>
        </div>
      )}
    </div>
  );
};

export default GoalsNeedingAttention;