import React, { useState } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Target, Clock, Calendar, TrendingUp } from 'lucide-react';

interface GoalSettingStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const GoalSettingStep: React.FC<GoalSettingStepProps> = ({ onNext, onPrevious }) => {
  const { preferences, updatePreferences } = useOnboardingStore();
  const [primaryGoal, setPrimaryGoal] = useState(preferences.primaryGoal);
  const [dailyGoal, setDailyGoal] = useState(preferences.dailyGoal);
  const [weeklyGoal, setWeeklyGoal] = useState(preferences.weeklyGoal);

  const goals = [
    {
      id: 'deep_work' as const,
      icon: Target,
      title: 'Deep Work Focus',
      description: 'Long, uninterrupted sessions for complex tasks',
      color: 'blue'
    },
    {
      id: 'task_completion' as const,
      icon: Clock,
      title: 'Task Completion',
      description: 'Getting things done efficiently with time tracking',
      color: 'green'
    },
    {
      id: 'habit_building' as const,
      icon: TrendingUp,
      title: 'Habit Building',
      description: 'Building consistent daily and weekly routines',
      color: 'purple'
    },
    {
      id: 'time_tracking' as const,
      icon: Calendar,
      title: 'Time Awareness',
      description: 'Understanding where your time goes',
      color: 'orange'
    }
  ];

  const handleNext = () => {
    updatePreferences({
      primaryGoal,
      dailyGoal,
      weeklyGoal
    });
    onNext();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          What's your primary productivity goal?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This helps us customize your experience and provide relevant insights.
        </p>
      </div>

      {/* Goal Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isSelected = primaryGoal === goal.id;
          
          return (
            <button
              key={goal.id}
              onClick={() => setPrimaryGoal(goal.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? `border-${goal.color}-500 bg-${goal.color}-50 dark:bg-${goal.color}-900/20`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isSelected 
                    ? `bg-${goal.color}-100 dark:bg-${goal.color}-800` 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isSelected 
                      ? `text-${goal.color}-600 dark:text-${goal.color}-400` 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium text-sm ${
                    isSelected 
                      ? 'text-gray-900 dark:text-gray-100' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {goal.title}
                  </h3>
                  <p className={`text-xs mt-1 ${
                    isSelected 
                      ? 'text-gray-600 dark:text-gray-400' 
                      : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {goal.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Time Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Set your time goals
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Daily Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Focus Goal
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="30"
                max="480"
                step="15"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                         slider:bg-primary-600 slider:rounded-lg"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>30m</span>
                <span className="font-medium text-primary-600 dark:text-primary-400">
                  {formatTime(dailyGoal)}
                </span>
                <span>8h</span>
              </div>
            </div>
          </div>

          {/* Weekly Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weekly Focus Goal
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min="120"
                max="2400"
                step="60"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>2h</span>
                <span className="font-medium text-primary-600 dark:text-primary-400">
                  {formatTime(weeklyGoal)}
                </span>
                <span>40h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Preview */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Your Goals Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Daily:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {formatTime(dailyGoal)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Weekly:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {formatTime(weeklyGoal)}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            You can adjust these goals anytime in settings.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onPrevious}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 
                   transition-colors"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                   focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
                   transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
};