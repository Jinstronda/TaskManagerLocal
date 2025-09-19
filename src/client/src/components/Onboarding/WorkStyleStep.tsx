import React, { useState } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Clock, Zap, Calendar } from 'lucide-react';

interface WorkStyleStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const WorkStyleStep: React.FC<WorkStyleStepProps> = ({ onNext, onPrevious }) => {
  const { preferences, updatePreferences } = useOnboardingStore();
  const [workStyle, setWorkStyle] = useState(preferences.workStyle);
  const [preferredSessionLength, setPreferredSessionLength] = useState(preferences.preferredSessionLength);

  const workStyles = [
    {
      id: 'focused_blocks' as const,
      icon: Clock,
      title: 'Focused Blocks',
      description: 'Long, uninterrupted sessions (25-90 minutes)',
      recommended: 'Best for deep work and complex tasks',
      color: 'blue'
    },
    {
      id: 'flexible' as const,
      icon: Zap,
      title: 'Flexible Sessions',
      description: 'Variable length sessions based on task needs',
      recommended: 'Great for mixed workloads and creativity',
      color: 'green'
    },
    {
      id: 'structured' as const,
      icon: Calendar,
      title: 'Structured Schedule',
      description: 'Fixed time blocks with regular breaks',
      recommended: 'Perfect for routine work and consistency',
      color: 'purple'
    }
  ];

  const sessionLengths = [
    { value: 15, label: '15 min', description: 'Quick tasks' },
    { value: 25, label: '25 min', description: 'Classic Pomodoro' },
    { value: 45, label: '45 min', description: 'Medium focus' },
    { value: 60, label: '60 min', description: 'Deep work' },
    { value: 90, label: '90 min', description: 'Extended focus' }
  ];

  const handleNext = () => {
    updatePreferences({
      workStyle,
      preferredSessionLength
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          How do you prefer to work?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the work style that matches your natural rhythm and preferences.
        </p>
      </div>

      {/* Work Style Selection */}
      <div className="space-y-3">
        {workStyles.map((style) => {
          const Icon = style.icon;
          const isSelected = workStyle === style.id;
          
          return (
            <button
              key={style.id}
              onClick={() => setWorkStyle(style.id)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected 
                    ? 'bg-primary-100 dark:bg-primary-800' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isSelected 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    isSelected 
                      ? 'text-gray-900 dark:text-gray-100' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {style.title}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    isSelected 
                      ? 'text-gray-600 dark:text-gray-400' 
                      : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {style.description}
                  </p>
                  <p className={`text-xs mt-2 ${
                    isSelected 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {style.recommended}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Session Length Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Preferred session length
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {sessionLengths.map((length) => {
            const isSelected = preferredSessionLength === length.value;
            
            return (
              <button
                key={length.value}
                onClick={() => setPreferredSessionLength(length.value)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className={`font-medium text-sm ${
                  isSelected 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {length.label}
                </div>
                <div className={`text-xs mt-1 ${
                  isSelected 
                    ? 'text-primary-500 dark:text-primary-500' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {length.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Style Preview */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Your Work Style
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-medium">Style:</span> {workStyles.find(s => s.id === workStyle)?.title}
          </p>
          <p className="mt-1">
            <span className="font-medium">Default session:</span> {preferredSessionLength} minutes
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          You can always change session lengths when starting a timer.
        </p>
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