import React, { useState } from 'react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { Bell, BellOff, Clock, Calendar } from 'lucide-react';

interface NotificationPreferencesStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

export const NotificationPreferencesStep: React.FC<NotificationPreferencesStepProps> = ({ 
  onNext, 
  onPrevious 
}) => {
  const { preferences, updatePreferences } = useOnboardingStore();
  const [notifications, setNotifications] = useState(preferences.notifications);

  const notificationOptions = [
    {
      id: 'sessionComplete' as const,
      icon: Clock,
      title: 'Session Completion',
      description: 'Get notified when your focus sessions end',
      recommended: true
    },
    {
      id: 'breakReminders' as const,
      icon: Bell,
      title: 'Break Reminders',
      description: 'Smart suggestions for when to take breaks',
      recommended: true
    },
    {
      id: 'dailyReview' as const,
      icon: Calendar,
      title: 'Daily Review',
      description: 'End-of-day reflection and planning prompts',
      recommended: false
    }
  ];

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleNext = () => {
    updatePreferences({ notifications });
    onNext();
  };

  const enabledCount = Object.values(notifications).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Notification preferences
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose which notifications help you stay focused and productive.
        </p>
      </div>

      {/* Notification Options */}
      <div className="space-y-3">
        {notificationOptions.map((option) => {
          const Icon = option.icon;
          const isEnabled = notifications[option.id];
          
          return (
            <div
              key={option.id}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isEnabled 
                    ? 'bg-primary-100 dark:bg-primary-800' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isEnabled 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {option.title}
                    </h3>
                    {option.recommended && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 
                                     text-green-700 dark:text-green-300 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggle(option.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                                peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 
                                rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                                peer-checked:after:border-white after:content-[''] after:absolute 
                                after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                                after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                                dark:border-gray-600 peer-checked:bg-primary-600">
                  </div>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notification Preview */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
            {enabledCount > 0 ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {enabledCount > 0 ? 'Notifications Enabled' : 'All Notifications Disabled'}
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {enabledCount > 0 
                ? `You'll receive ${enabledCount} type${enabledCount > 1 ? 's' : ''} of notifications to help you stay focused.`
                : 'You can enable notifications later in settings if you change your mind.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Additional Settings Preview */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          What's next?
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Fine-tune notification timing and sounds in settings</li>
          <li>• Set up focus mode to minimize distractions</li>
          <li>• Configure break reminder frequency</li>
          <li>• Customize daily review questions</li>
        </ul>
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