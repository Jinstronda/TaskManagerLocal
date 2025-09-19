import React, { useEffect, useState } from 'react';
import { Trophy, Star, Calendar, Sparkles, X } from 'lucide-react';
import { useWeeklyGoalsStore } from '../../stores/weeklyGoalsStore';

interface GoalAchievementsProps {
  className?: string;
  showCelebration?: boolean;
}

/**
 * GoalAchievements Component
 * 
 * Displays goal achievements and celebrations.
 * Shows recent achievements, milestone celebrations, and achievement history.
 * Provides interactive celebration animations and notifications.
 */
export const GoalAchievements: React.FC<GoalAchievementsProps> = ({
  className = '',
  showCelebration = true
}) => {
  const {
    achievements,
    loading,
    error,
    fetchAchievements,
    celebrateAchievement,
    clearError
  } = useWeeklyGoalsStore();

  const [celebrationModal, setCelebrationModal] = useState<{
    isOpen: boolean;
    message: string;
    milestone?: string;
  }>({ isOpen: false, message: '' });

  const [selectedDateRange, setSelectedDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    fetchAchievements(selectedDateRange.start, selectedDateRange.end);
  }, [fetchAchievements, selectedDateRange]);

  const handleCelebrate = async (categoryId: number, weekStart: string) => {
    try {
      const result = await celebrateAchievement(categoryId, weekStart);
      if (showCelebration) {
        setCelebrationModal({
          isOpen: true,
          message: result.message,
          milestone: result.milestone
        });
      }
    } catch (error) {
      console.error('Failed to celebrate achievement:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getAchievementIcon = (overachievementPercentage: number) => {
    if (overachievementPercentage >= 50) return <Star className="w-5 h-5 text-yellow-500" />;
    if (overachievementPercentage >= 25) return <Trophy className="w-5 h-5 text-blue-500" />;
    return <Trophy className="w-5 h-5 text-green-500" />;
  };

  const getAchievementBadge = (overachievementPercentage: number) => {
    if (overachievementPercentage >= 50) return { text: 'Superstar', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
    if (overachievementPercentage >= 25) return { text: 'Overachiever', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
    return { text: 'Goal Achieved', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  };

  if (loading.achievements) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-1"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
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
          <Trophy className="w-5 h-5" />
          <span className="font-medium">Error Loading Achievements</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={() => {
            clearError();
            fetchAchievements(selectedDateRange.start, selectedDateRange.end);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Goal Achievements
          </h3>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDateRange.start}
            onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <span className="text-gray-500 text-xs">to</span>
          <input
            type="date"
            value={selectedDateRange.end}
            onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Achievements List */}
      {achievements.length > 0 ? (
        <div className="space-y-4">
          {achievements.map((achievement, index) => {
            const badge = getAchievementBadge(achievement.overachievementPercentage);
            
            return (
              <div
                key={`${achievement.categoryId}-${achievement.weekStart}-${index}`}
                className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                      {getAchievementIcon(achievement.overachievementPercentage)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {achievement.categoryName}
                        </h4>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.color}`}>
                          {badge.text}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Week of {formatDate(new Date(achievement.weekStart))}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Target: </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatTime(achievement.targetMinutes)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Achieved: </span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatTime(achievement.actualMinutes)}
                          </span>
                        </div>
                        {achievement.overachievementPercentage > 0 && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Bonus: </span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              +{Math.round(achievement.overachievementPercentage)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(achievement.achievedAt)}
                    </span>
                    {showCelebration && (
                      <button
                        onClick={() => handleCelebrate(achievement.categoryId, achievement.weekStart)}
                        disabled={loading.celebration}
                        className="p-1 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 disabled:opacity-50"
                        title="Celebrate this achievement"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Achievements Yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Complete your weekly goals to earn achievements and celebrate your progress!
          </p>
        </div>
      )}

      {/* Celebration Modal */}
      {celebrationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-center">
            <div className="mb-4">
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full w-fit mx-auto mb-4 animate-bounce">
                <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 Congratulations! 🎉
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {celebrationModal.message}
              </p>
              {celebrationModal.milestone && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                  <p className="text-blue-700 dark:text-blue-300 font-medium">
                    🏆 Milestone: {celebrationModal.milestone}
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setCelebrationModal({ isOpen: false, message: '' })}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalAchievements;