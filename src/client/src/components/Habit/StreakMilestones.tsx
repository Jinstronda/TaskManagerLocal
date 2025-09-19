import React, { useEffect } from 'react';
import { Target, Trophy, Star, Zap } from 'lucide-react';
import { useStreakStore } from '../../stores/streakStore';

interface StreakMilestonesProps {
  className?: string;
  showProgress?: boolean;
}

/**
 * StreakMilestones Component
 * 
 * Displays upcoming streak milestones and progress towards them.
 * Shows achievement badges for completed milestones and motivation
 * for upcoming goals.
 */
export const StreakMilestones: React.FC<StreakMilestonesProps> = ({
  className = '',
  showProgress = true
}) => {
  const {
    streakInfo,
    milestones,
    loading,
    error,
    fetchMilestones,
    fetchStreakInfo
  } = useStreakStore();

  useEffect(() => {
    fetchMilestones();
    fetchStreakInfo();
  }, [fetchMilestones, fetchStreakInfo]);

  // Define milestone configurations
  const milestoneConfigs = [
    { days: 3, title: 'Getting Started', icon: Zap, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { days: 7, title: 'One Week', icon: Star, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
    { days: 14, title: 'Two Weeks', icon: Target, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
    { days: 30, title: 'One Month', icon: Trophy, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
    { days: 60, title: 'Two Months', icon: Trophy, color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { days: 90, title: 'Three Months', icon: Trophy, color: 'text-pink-500', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
    { days: 180, title: 'Six Months', icon: Trophy, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
    { days: 365, title: 'One Year', icon: Trophy, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' }
  ];

  const currentStreak = streakInfo?.currentStreak || 0;

  // Get milestone status
  const getMilestoneStatus = (days: number) => {
    if (currentStreak >= days) return 'completed';
    return 'upcoming';
  };

  // Get next milestone
  const getNextMilestone = () => {
    return milestoneConfigs.find(m => m.days > currentStreak);
  };

  // Calculate progress to next milestone
  const getProgressToNext = () => {
    const next = getNextMilestone();
    if (!next) return 100;
    
    const previous = milestoneConfigs
      .filter(m => m.days <= currentStreak)
      .pop();
    
    const start = previous?.days || 0;
    const progress = ((currentStreak - start) / (next.days - start)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  if (loading.milestones || loading.streakInfo) {
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
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const nextMilestone = getNextMilestone();
  const progressToNext = getProgressToNext();
  const completedMilestones = milestoneConfigs.filter(m => getMilestoneStatus(m.days) === 'completed');
  const upcomingMilestones = milestoneConfigs.filter(m => getMilestoneStatus(m.days) === 'upcoming').slice(0, 3);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Streak Milestones
        </h3>
      </div>

      {/* Next Milestone Progress */}
      {nextMilestone && showProgress && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 ${nextMilestone.bgColor} rounded-full`}>
              <nextMilestone.icon className={`w-5 h-5 ${nextMilestone.color}`} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Next: {nextMilestone.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {nextMilestone.days - currentStreak} days to go
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
              <span>{currentStreak} days</span>
              <span>{nextMilestone.days} days</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {Math.round(progressToNext)}% complete
          </p>
        </div>
      )}

      {/* Completed Milestones */}
      {completedMilestones.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            🏆 Achievements ({completedMilestones.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {completedMilestones.map((milestone) => (
              <div
                key={milestone.days}
                className={`${milestone.bgColor} border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-center`}
              >
                <milestone.icon className={`w-6 h-6 ${milestone.color} mx-auto mb-1`} />
                <div className="text-xs font-medium text-gray-900 dark:text-white">
                  {milestone.title}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {milestone.days} days
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Milestones */}
      {upcomingMilestones.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            🎯 Upcoming Goals
          </h4>
          <div className="space-y-3">
            {upcomingMilestones.map((milestone, index) => {
              const daysToGo = milestone.days - currentStreak;
              const isNext = index === 0;
              
              return (
                <div
                  key={milestone.days}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isNext
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className={`p-2 ${milestone.bgColor} rounded-full ${isNext ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''}`}>
                    <milestone.icon className={`w-4 h-4 ${milestone.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {milestone.title}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {milestone.days} days
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {daysToGo} days to go
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Motivation Message */}
      {currentStreak === 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300 text-center">
            🌟 Start your journey! Complete your first focus session to unlock achievements.
          </p>
        </div>
      )}

      {currentStreak > 0 && !nextMilestone && (
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-700 dark:text-purple-300 text-center">
            🎉 Incredible! You've achieved all milestones. You're a true focus master!
          </p>
        </div>
      )}
    </div>
  );
};

export default StreakMilestones;