import React, { useState } from 'react';
import { 
  StreakDisplay, 
  HabitChain, 
  GracePeriodDialog, 
  StreakMilestones,
  WeeklyGoalsManager,
  GoalProgressChart,
  GoalAchievements,
  GoalsNeedingAttention,
  FocusScoreDisplay,
  AchievementBadges,
  HabitStatistics
} from '../components/Habit';

/**
 * Habits Page
 * 
 * Displays habit tracking and streak system components.
 * Shows streak information, habit chains, milestones, and recovery options.
 */
const Habits: React.FC = () => {
  const [showGracePeriodDialog, setShowGracePeriodDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Habit Tracking
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your focus streaks and build consistent habits
        </p>
      </div>

      {/* Top Row - Streak Display and Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StreakDisplay />
        <StreakMilestones />
      </div>

      {/* Weekly Goals Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WeeklyGoalsManager />
        <GoalProgressChart />
      </div>

      {/* Goals Status */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GoalsNeedingAttention />
        <GoalAchievements />
      </div>

      {/* Focus Score and Achievements */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FocusScoreDisplay />
        <AchievementBadges />
      </div>

      {/* Habit Statistics */}
      <HabitStatistics />

      {/* Habit Chain */}
      <HabitChain />

      {/* Test Grace Period Dialog */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Grace Period Recovery
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Test the grace period dialog functionality (for development purposes).
        </p>
        <button
          onClick={() => setShowGracePeriodDialog(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Test Grace Period Dialog
        </button>
      </div>

      {/* Grace Period Dialog */}
      <GracePeriodDialog
        isOpen={showGracePeriodDialog}
        onClose={() => setShowGracePeriodDialog(false)}
        onRecovered={() => {
          console.log('Streak recovered!');
          setShowGracePeriodDialog(false);
        }}
      />
    </div>
  );
};

export default Habits;