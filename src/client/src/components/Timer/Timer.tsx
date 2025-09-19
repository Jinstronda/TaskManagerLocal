import React, { useState } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { useTaskStore } from '../../stores/taskStore';
import { CountdownDisplay } from './CountdownDisplay';
import { ProgressRing } from './ProgressRing';
import { SessionControls } from './SessionControls';
import { SessionTypeSelector } from './SessionTypeSelector';
import { SystemSleepDialog } from './SystemSleepDialog';
import { TaskSelector } from './TaskSelector';
import { TaskSwitcher } from './TaskSwitcher';
import { TaskCompletionDialog } from './TaskCompletionDialog';
import FocusModeToggle from '../Focus/FocusModeToggle';
import { Task } from '../../../../shared/types';

export const Timer: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showTaskCreation, setShowTaskCreation] = useState(false);

  const {
    isRunning,
    isPaused,
    formattedTime,
    progress,
    sessionType,
    sessionTypeColor,
    sessionTypeDisplayName,
    isSystemSleepDetected,
    currentSession,
    plannedDuration,
    remainingTime,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeSession,
    updateSessionType,
    switchTask,
    completeCurrentTask,
    canStartTimer,
    canPauseTimer,
    canResumeTimer,
    canStopTimer,
  } = useTimer();

  const { tasks, completeTask } = useTaskStore();

  // Get current task details
  const currentTask = currentSession?.taskId 
    ? tasks.find(t => t.id === currentSession.taskId) 
    : null;

  // Calculate session duration in minutes
  const sessionDurationMinutes = Math.round((plannedDuration * 60 - remainingTime) / 60);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      {/* System Sleep Detection Dialog */}
      {isSystemSleepDetected && (
        <SystemSleepDialog
          onResume={resumeTimer}
          onStop={stopTimer}
        />
      )}

      {/* Focus Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <FocusModeToggle />
      </div>

      {/* Main Timer Container */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 max-w-2xl w-full">
        {/* Session Type Display */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {sessionTypeDisplayName}
          </h1>
          {currentTask && (
            <p className="text-gray-600 dark:text-gray-400">
              Working on: {currentTask.title}
            </p>
          )}
        </div>

        {/* Progress Ring and Countdown */}
        <div className="relative flex items-center justify-center mb-12">
          {/* Progress Ring Container with proper positioning */}
          <div className="relative">
            <ProgressRing
              progress={progress}
              color={sessionTypeColor}
              size={320}
              strokeWidth={8}
              isRunning={isRunning}
              isPaused={isPaused}
            />
            {/* Countdown Display positioned precisely in center of ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <CountdownDisplay
                time={formattedTime}
                isRunning={isRunning}
                isPaused={isPaused}
                color={sessionTypeColor}
              />
            </div>
          </div>
        </div>

        {/* Session Controls */}
        <div className="mb-8">
          <SessionControls
            isRunning={isRunning}
            isPaused={isPaused}
            canStart={canStartTimer()}
            canPause={canPauseTimer()}
            canResume={canResumeTimer()}
            canStop={canStopTimer()}
            onStart={() => startTimer(sessionType, plannedDuration, selectedTask?.id)}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onStop={stopTimer}
            onComplete={() => setShowCompletionDialog(true)}
          />
        </div>

        {/* Task Selection (when not running) */}
        {!isRunning && (
          <div className="mb-6">
            <TaskSelector
              selectedTaskId={selectedTask?.id}
              onTaskSelect={setSelectedTask}
              onCreateTask={() => setShowTaskCreation(true)}
            />
          </div>
        )}

        {/* Task Switcher (when running) */}
        {isRunning && (
          <div className="mb-6">
            <TaskSwitcher
              currentTaskId={currentSession?.taskId}
              onTaskSwitch={(task) => switchTask(task?.id)}
              sessionDuration={sessionDurationMinutes}
            />
          </div>
        )}

        {/* Session Type Selector */}
        {!isRunning && (
          <div className="mt-8">
            <SessionTypeSelector
              currentType={sessionType}
              onTypeChange={updateSessionType}
            />
          </div>
        )}

        {/* Session Status */}
        <div className="text-center mt-6">
          {isRunning && !isPaused && (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Session in progress
              </span>
            </div>
          )}
          {isRunning && isPaused && (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Session paused
              </span>
            </div>
          )}
          {!isRunning && (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Ready to start
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Keyboard shortcuts: <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Space</kbd> to start/pause, 
          <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs ml-2">Esc</kbd> to stop,
          <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs ml-2">Enter</kbd> to complete
        </p>
      </div>

      {/* Task Completion Dialog */}
      {showCompletionDialog && currentSession && (
        <TaskCompletionDialog
          isOpen={showCompletionDialog}
          onClose={() => setShowCompletionDialog(false)}
          task={currentTask}
          session={currentSession}
          onTaskComplete={async (taskId) => {
            await completeCurrentTask();
            await completeTask(taskId);
          }}
          onSessionComplete={async (qualityRating, notes) => {
            await completeSession(qualityRating, notes);
            setShowCompletionDialog(false);
          }}
        />
      )}

      {/* Task Creation Modal - TODO: Implement this */}
      {showTaskCreation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <p className="text-gray-900 dark:text-gray-100">Task creation modal - TODO</p>
            <button 
              onClick={() => setShowTaskCreation(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};