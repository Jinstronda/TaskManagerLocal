import React, { useEffect } from 'react';
import { Flame, Trophy, Calendar, Clock } from 'lucide-react';
import { useStreakStore } from '../../stores/streakStore';

interface StreakDisplayProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * StreakDisplay Component
 * 
 * Displays current streak information with visual indicators.
 * Shows current streak, longest streak, and grace period status.
 * Provides quick access to streak recovery if needed.
 */
export const StreakDisplay: React.FC<StreakDisplayProps> = ({ 
  className = '', 
  showDetails = true 
}) => {
  const {
    streakInfo,
    loading,
    error,
    fetchStreakInfo,
    recoverStreak,
    clearError
  } = useStreakStore();

  // Fetch streak info on component mount
  useEffect(() => {
    fetchStreakInfo();
  }, [fetchStreakInfo]);

  // Handle streak recovery
  const handleRecoverStreak = async () => {
    if (!streakInfo?.gracePeriodActive) return;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    try {
      const result = await recoverStreak(dateStr);
      if (result.success) {
        // Show success message (could integrate with toast system)
        console.log('Streak recovered successfully!');
      }
    } catch (error) {
      console.error('Failed to recover streak:', error);
    }
  };

  if (loading.streakInfo) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <Calendar className="w-5 h-5" />
          <span className="font-medium">Error Loading Streak</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={() => {
            clearError();
            fetchStreakInfo();
          }}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!streakInfo) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Calendar className="w-5 h-5" />
          <span>No streak data available</span>
        </div>
      </div>
    );
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600 dark:text-purple-400';
    if (streak >= 14) return 'text-blue-600 dark:text-blue-400';
    if (streak >= 7) return 'text-green-600 dark:text-green-400';
    if (streak >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return <Trophy className="w-6 h-6" />;
    return <Flame className="w-6 h-6" />;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Focus Streak
        </h3>
        {streakInfo.gracePeriodActive && (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Grace Period</span>
          </div>
        )}
      </div>

      {/* Current Streak */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`${getStreakColor(streakInfo.currentStreak)}`}>
          {getStreakIcon(streakInfo.currentStreak)}
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getStreakColor(streakInfo.currentStreak)}`}>
              {streakInfo.currentStreak}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {streakInfo.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Current streak
          </p>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Longest Streak */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              Longest streak
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {streakInfo.longestStreak} {streakInfo.longestStreak === 1 ? 'day' : 'days'}
            </span>
          </div>

          {/* Last Streak Date */}
          {streakInfo.lastStreakDate && (
            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                Last streak day
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(streakInfo.lastStreakDate).toLocaleDateString()}
              </span>
            </div>
          )}

          {/* Grace Period Info */}
          {streakInfo.gracePeriodActive && streakInfo.gracePeriodEndsAt && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-medium text-sm">Grace Period Active</span>
              </div>
              <p className="text-amber-600 dark:text-amber-400 text-xs mb-3">
                Your streak is protected until {streakInfo.gracePeriodEndsAt.toLocaleDateString()}. 
                Complete a focus session to maintain your streak!
              </p>
              <button
                onClick={handleRecoverStreak}
                disabled={loading.recovery}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
              >
                {loading.recovery ? 'Recovering...' : 'Recover Streak'}
              </button>
            </div>
          )}

          {/* Streak Motivation */}
          {streakInfo.currentStreak === 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                🎯 Start your focus journey! Complete a 25-minute session to begin your streak.
              </p>
            </div>
          )}

          {streakInfo.currentStreak > 0 && streakInfo.currentStreak < 7 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-sm">
                🔥 Great start! Keep going to reach your first week streak.
              </p>
            </div>
          )}

          {streakInfo.currentStreak >= 7 && streakInfo.currentStreak < 30 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                ⭐ Excellent consistency! You're building a strong habit.
              </p>
            </div>
          )}

          {streakInfo.currentStreak >= 30 && (
            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                🏆 Incredible dedication! You're a focus master.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StreakDisplay;