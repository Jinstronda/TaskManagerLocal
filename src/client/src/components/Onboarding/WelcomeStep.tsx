import React, { useState } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Timer, Target, TrendingUp, BarChart3 } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const { updatePreferences } = useOnboardingStore();
  const [name, setName] = useState('');

  const handleNext = () => {
    if (name.trim()) {
      updatePreferences({ name: name.trim() });
    }
    onNext();
  };

  const features = [
    {
      icon: Timer,
      title: 'Focus Sessions',
      description: 'Track deep work with customizable timers and session types'
    },
    {
      icon: Target,
      title: 'Task Management',
      description: 'Organize tasks by categories and track time spent on each'
    },
    {
      icon: TrendingUp,
      title: 'Habit Building',
      description: 'Build consistency with daily streaks and weekly goals'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Gain insights into your productivity patterns and progress'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Timer className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome to Local Task Tracker
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          A privacy-focused productivity app that helps you build better focus habits 
          through time tracking, task management, and mindful work practices.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div 
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Name Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What should we call you? (Optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                     placeholder-gray-400 dark:placeholder-gray-500"
            maxLength={50}
          />
        </div>
      </div>

      {/* Privacy Note */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
            🔒
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Your Privacy Matters
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              All your data stays on your device. No cloud sync, no tracking, no data collection.
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 
                   focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
                   transition-colors font-medium"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};