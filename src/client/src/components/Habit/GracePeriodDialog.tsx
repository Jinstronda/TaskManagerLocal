import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useStreakStore } from '../../stores/streakStore';

interface GracePeriodDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecovered?: () => void;
}

/**
 * GracePeriodDialog Component
 * 
 * Modal dialog for streak recovery during grace period.
 * Allows users to recover their streak by acknowledging missed days
 * and committing to continue their habit.
 */
export const GracePeriodDialog: React.FC<GracePeriodDialogProps> = ({
  isOpen,
  onClose,
  onRecovered
}) => {
  const { streakInfo, loading, recoverStreak } = useStreakStore();
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !streakInfo?.gracePeriodActive) return null;

  const handleRecoverStreak = async () => {
    setIsRecovering(true);
    setRecoveryResult(null);

    try {
      // Calculate the date to recover (yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const result = await recoverStreak(dateStr);
      setRecoveryResult(result);

      if (result.success) {
        setTimeout(() => {
          onRecovered?.();
          onClose();
        }, 2000); // Close after 2 seconds to show success message
      }
    } catch (error) {
      setRecoveryResult({
        success: false,
        message: 'Failed to recover streak. Please try again.'
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const gracePeriodEndsAt = streakInfo.gracePeriodEndsAt;
  const timeRemaining = gracePeriodEndsAt ? 
    Math.max(0, Math.ceil((gracePeriodEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Streak Grace Period
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!recoveryResult ? (
            <>
              {/* Grace Period Info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Your streak is protected</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  You missed yesterday's focus session, but your {streakInfo.currentStreak}-day streak 
                  is still safe! You have a grace period to recover it.
                </p>
                
                {gracePeriodEndsAt && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <div className="text-sm">
                      <div className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Grace period ends:
                      </div>
                      <div className="text-amber-700 dark:text-amber-300">
                        {formatDate(gracePeriodEndsAt)}
                      </div>
                      <div className="text-amber-600 dark:text-amber-400 mt-1">
                        ({timeRemaining} {timeRemaining === 1 ? 'day' : 'days'} remaining)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recovery Options */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                  How to maintain your streak:
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Complete a focus session today to continue your streak</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Or use the recovery option below to acknowledge the missed day</span>
                  </li>
                </ul>
              </div>

              {/* Recovery Action */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Streak Recovery
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
                  If you had a valid reason for missing yesterday (illness, emergency, etc.), 
                  you can recover your streak and continue building your habit.
                </p>
                <button
                  onClick={handleRecoverStreak}
                  disabled={isRecovering || loading.recovery}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isRecovering || loading.recovery ? 'Recovering Streak...' : 'Recover My Streak'}
                </button>
              </div>
            </>
          ) : (
            /* Recovery Result */
            <div className="text-center py-4">
              {recoveryResult.success ? (
                <>
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Streak Recovered!
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                    {recoveryResult.message}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Keep up the great work! Complete today's session to continue building your habit.
                  </p>
                </>
              ) : (
                <>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                    Recovery Failed
                  </h3>
                  <p className="text-red-700 dark:text-red-300 text-sm mb-4">
                    {recoveryResult.message}
                  </p>
                  <button
                    onClick={() => setRecoveryResult(null)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!recoveryResult && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GracePeriodDialog;