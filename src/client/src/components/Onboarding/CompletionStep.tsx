import React from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { CheckCircle, Timer, Target, Bell, Folder } from 'lucide-react';

interface CompletionStepProps {
  onComplete: () => void;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({ onComplete }) => {
  const { preferences } = useOnboardingStore();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getWorkStyleLabel = (style: string) => {
    switch (style) {
      case 'focused_blocks': return 'Focused Blocks';
      case 'flexible': return 'Flexible Sessions';
      case 'structured': return 'Structured Schedule';
      default: return style;
    }
  };

  const getPrimaryGoalLabel = (goal: string) => {
    switch (goal) {
      case 'deep_work': return 'Deep Work Focus';
      case 'task_completion': return 'Task Completion';
      case 'habit_building': return 'Habit Building';
      case 'time_tracking': return 'Time Awareness';
      default: return goal;
    }
  };

  const enabledNotifications = Object.entries(preferences.notifications)
    .filter(([_, enabled]) => enabled)
    .map(([key, _]) => {
      switch (key) {
        case 'sessionComplete': return 'Session completion';
        case 'breakReminders': return 'Break reminders';
        case 'dailyReview': return 'Daily review';
        default: return key;
      }
    });

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {preferences.name ? `Welcome, ${preferences.name}!` : 'You\'re all set!'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your productivity workspace is ready. Here's what we've set up for you:
        </p>
      </div>

      {/* Setup Summary */}
      <div className="space-y-4">
        {/* Goals */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Your Goals</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <p>Primary focus: {getPrimaryGoalLabel(preferences.primaryGoal)}</p>
                <p>Daily goal: {formatTime(preferences.dailyGoal)}</p>
                <p>Weekly goal: {formatTime(preferences.weeklyGoal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Work Style */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Timer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Work Style</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <p>Style: {getWorkStyleLabel(preferences.workStyle)}</p>
                <p>Preferred session: {preferences.preferredSessionLength} minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Folder className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Categories</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                <p>{preferences.categories.length} categories created</p>
                {preferences.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {preferences.categories.slice(0, 3).map((category, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                    ))}
                    {preferences.categories.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        +{preferences.categories.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {enabledNotifications.length > 0 ? (
                  <p>Enabled: {enabledNotifications.join(', ')}</p>
                ) : (
                  <p>All notifications disabled</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Ready to get started?
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Start your first focus session from the Timer page</li>
          <li>• Create tasks and assign them to your categories</li>
          <li>• Track your progress on the Analytics dashboard</li>
          <li>• Adjust settings anytime to match your workflow</li>
        </ul>
      </div>

      {/* Complete Button */}
      <div className="flex justify-center">
        <button
          onClick={onComplete}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                   focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
                   transition-colors font-medium text-lg"
        >
          Start Using Local Task Tracker
        </button>
      </div>
    </div>
  );
};