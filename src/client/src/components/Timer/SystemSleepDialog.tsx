import React from 'react';
import { AlertTriangle, Play, Square } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SystemSleepDialogProps {
  onResume: () => void;
  onStop: () => void;
}

export const SystemSleepDialog: React.FC<SystemSleepDialogProps> = ({
  onResume,
  onStop,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-full">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              System Sleep Detected
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your timer has been paused
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            It looks like your computer went to sleep or was inactive for a while. 
            Your timer has been automatically paused to ensure accurate time tracking.
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onResume}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl',
              'bg-blue-500 hover:bg-blue-600 text-white font-medium',
              'shadow-lg hover:shadow-xl transform hover:scale-105',
              'transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300'
            )}
          >
            <Play className="w-4 h-4" />
            <span>Resume Timer</span>
          </button>
          
          <button
            onClick={onStop}
            className={cn(
              'flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl',
              'bg-gray-500 hover:bg-gray-600 text-white font-medium',
              'shadow-lg hover:shadow-xl transform hover:scale-105',
              'transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300'
            )}
          >
            <Square className="w-4 h-4" />
            <span>Stop Session</span>
          </button>
        </div>

        {/* Tip */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> To prevent interruptions, consider adjusting your computer's 
            sleep settings during focus sessions.
          </p>
        </div>
      </div>
    </div>
  );
};