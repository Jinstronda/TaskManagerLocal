import React, { useState } from 'react';
import { CheckCircle, Clock, Target, Star, MessageSquare, X } from 'lucide-react';
import { Task, Session } from '../../../../shared/types';
import { useTaskStore } from '../../stores/taskStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useMindfulnessStore } from '../../stores/mindfulnessStore';
import TransitionAnimations from '../Mindfulness/TransitionAnimations';
import MindfulnessPrompt from '../Mindfulness/MindfulnessPrompt';
import SessionReflection from '../Mindfulness/SessionReflection';
import { cn } from '../../utils/cn';

interface TaskCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  session: Session;
  onTaskComplete: (taskId: number) => Promise<void>;
  onSessionComplete: (qualityRating?: number, notes?: string) => Promise<void>;
}

export const TaskCompletionDialog: React.FC<TaskCompletionDialogProps> = ({
  isOpen,
  onClose,
  task,
  session,
  onTaskComplete,
  onSessionComplete,
}) => {
  const [qualityRating, setQualityRating] = useState<number>(4);
  const [notes, setNotes] = useState('');
  const [markTaskComplete, setMarkTaskComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMindfulTransition, setShowMindfulTransition] = useState(true);
  const [currentTransitionStep, setCurrentTransitionStep] = useState<'animation' | 'prompt' | 'reflection' | 'completion'>('animation');

  const { categories } = useCategoryStore();
  const { 
    mindfulnessEnabled,
    transitionAnimationsEnabled,
    breathingExerciseEnabled,
    sessionReflectionEnabled,
    recordMindfulnessSession 
  } = useMindfulnessStore();

  if (!isOpen) return null;

  // Get category for task
  const category = task ? categories.find(c => c.id === task.categoryId) : null;

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Calculate session duration
  const sessionDuration = session.actualDuration || 0;

  // Calculate progress vs estimate
  const getProgressInfo = () => {
    if (!task?.estimatedDuration) return null;
    
    const totalActualTime = (task.actualDuration || 0) + sessionDuration;
    const estimatedTime = task.estimatedDuration;
    const progressPercentage = Math.round((totalActualTime / estimatedTime) * 100);
    const timeVariance = totalActualTime - estimatedTime;
    
    return {
      totalActualTime,
      estimatedTime,
      progressPercentage,
      timeVariance,
      isOverEstimate: timeVariance > 0,
      isComplete: progressPercentage >= 100,
    };
  };

  const progressInfo = getProgressInfo();

  // Handle mindful transition steps
  const handleTransitionNext = () => {
    if (currentTransitionStep === 'animation') {
      setCurrentTransitionStep('prompt');
    } else if (currentTransitionStep === 'prompt') {
      setCurrentTransitionStep('reflection');
    } else if (currentTransitionStep === 'reflection') {
      setCurrentTransitionStep('completion');
      setShowMindfulTransition(false);
    }
  };

  const handleSkipTransition = () => {
    setShowMindfulTransition(false);
    setCurrentTransitionStep('completion');
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Complete the session first
      await onSessionComplete(qualityRating, notes || undefined);
      
      // Mark task as complete if requested
      if (markTaskComplete && task) {
        await onTaskComplete(task.id);
      }
      
      // Record mindful transition if it was used
      if (mindfulnessEnabled && !showMindfulTransition) {
        recordMindfulnessSession('session_completion', 30); // 30 seconds average
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to complete session/task:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show mindful transition if enabled and not skipped
  if (isOpen && mindfulnessEnabled && showMindfulTransition) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {currentTransitionStep === 'animation' && (
            <TransitionAnimations
              onComplete={handleTransitionNext}
              onSkip={handleSkipTransition}
            />
          )}
          
          {currentTransitionStep === 'prompt' && breathingExerciseEnabled && (
            <MindfulnessPrompt
              onComplete={handleTransitionNext}
              onSkip={handleSkipTransition}
            />
          )}
          
          {currentTransitionStep === 'reflection' && sessionReflectionEnabled && (
            <SessionReflection
              session={session}
              task={task}
              onComplete={handleTransitionNext}
              onSkip={handleSkipTransition}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Session Complete!
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDuration(sessionDuration)} of focused work
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Task Information */}
        {task && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <div 
                className="w-4 h-4 rounded-full mt-0.5"
                style={{ backgroundColor: category?.color || '#6B7280' }}
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {category?.name}
                </p>
                
                {/* Progress Information */}
                {progressInfo && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                      <span className={cn(
                        'font-medium',
                        progressInfo.isComplete 
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-blue-600 dark:text-blue-400'
                      )}>
                        {progressInfo.progressPercentage}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={cn(
                          'h-2 rounded-full transition-all duration-300',
                          progressInfo.isComplete 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                        )}
                        style={{ width: `${Math.min(progressInfo.progressPercentage, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Total: {formatDuration(progressInfo.totalActualTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>Est: {formatDuration(progressInfo.estimatedTime)}</span>
                      </div>
                    </div>
                    
                    {progressInfo.timeVariance !== 0 && (
                      <p className={cn(
                        'text-xs text-center',
                        progressInfo.isOverEstimate 
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-green-600 dark:text-green-400'
                      )}>
                        {progressInfo.isOverEstimate ? '+' : '-'}
                        {formatDuration(Math.abs(progressInfo.timeVariance))} 
                        {progressInfo.isOverEstimate ? ' over estimate' : ' under estimate'}
                      </p>
                    )}
                  </div>
                )}

                {/* Task Completion Option */}
                <div className="mt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markTaskComplete}
                      onChange={(e) => setMarkTaskComplete(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Mark this task as complete
                    </span>
                  </label>
                  {markTaskComplete && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-6">
                      Task will be moved to completed status
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Session Quality Rating */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            How was your focus quality?
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => setQualityRating(rating)}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  rating <= qualityRating
                    ? 'text-yellow-400 hover:text-yellow-500'
                    : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'
                )}
              >
                <Star className={cn(
                  'w-5 h-5',
                  rating <= qualityRating && 'fill-current'
                )} />
              </button>
            ))}
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {qualityRating === 1 && 'Poor'}
              {qualityRating === 2 && 'Fair'}
              {qualityRating === 3 && 'Good'}
              {qualityRating === 4 && 'Great'}
              {qualityRating === 5 && 'Excellent'}
            </span>
          </div>
        </div>

        {/* Session Notes */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Session notes (optional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you accomplish? Any insights or challenges?"
              rows={3}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Complete Session</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};