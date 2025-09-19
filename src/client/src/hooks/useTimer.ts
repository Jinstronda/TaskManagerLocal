import { useEffect, useRef } from 'react';
import { useTimerStore } from '../stores/timerStore';
import { timerService } from '../services/TimerService';

/**
 * Custom hook to manage timer functionality
 * Handles timer service lifecycle and state synchronization
 */
export const useTimer = () => {
  const timerServiceRef = useRef(timerService);
  const isInitialized = useRef(false);
  
  const {
    isRunning,
    isPaused,
    remainingTime,
    sessionType,
    plannedDuration,
    currentSession,
    isSystemSleepDetected,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeSession,
    updateSessionType,
    updatePlannedDuration,
    updateSessionPreferences,
    sessionPreferences,
    switchTask,
    completeCurrentTask,
    updateTaskActualDuration,
  } = useTimerStore();

  // Initialize timer service on mount
  useEffect(() => {
    if (!isInitialized.current) {
      // Try to recover timer state from previous session
      const recovered = timerServiceRef.current.recoverTimerState();
      
      if (recovered) {
        console.log('Timer state recovered from previous session');
      }
      
      // Start the timer service
      timerServiceRef.current.start();
      isInitialized.current = true;
    }

    // Cleanup on unmount
    return () => {
      if (isInitialized.current) {
        timerServiceRef.current.stop();
        isInitialized.current = false;
      }
    };
  }, []);

  // Format remaining time for display
  const formattedTime = timerServiceRef.current.formatTime(remainingTime, remainingTime >= 3600);
  
  // Calculate session progress percentage
  const progress = timerServiceRef.current.getSessionProgress(remainingTime, plannedDuration);
  
  // Get session type display name
  const sessionTypeDisplayName = timerServiceRef.current.getSessionTypeDisplayName(sessionType);
  
  // Get session type color
  const sessionTypeColor = timerServiceRef.current.getSessionTypeColor(sessionType);

  // Helper function to start a new session
  const startNewSession = (
    type: typeof sessionType,
    duration?: number,
    taskId?: number,
    categoryId?: number
  ) => {
    const sessionDuration = duration || timerServiceRef.current.getDurationForSessionType(type);
    startTimer(type, sessionDuration, taskId, categoryId);
  };

  // Helper function to handle session completion with rating
  const completeSessionWithRating = async (rating?: number, notes?: string) => {
    await completeSession(rating, notes);
  };

  // Helper function to get duration options for session type
  const getDurationOptions = (type: typeof sessionType) => {
    switch (type) {
      case 'deep_work':
        return [25, 45, 50, 90];
      case 'quick_task':
        return [5, 10, 15, 25];
      case 'break':
        return [5, 10, 15, 30];
      case 'custom':
        return [15, 25, 30, 45, 60, 90];
      default:
        return [25, 45, 50, 90];
    }
  };

  // Helper function to check if timer can be started
  const canStartTimer = () => {
    return !isRunning;
  };

  // Helper function to check if timer can be paused
  const canPauseTimer = () => {
    return isRunning && !isPaused;
  };

  // Helper function to check if timer can be resumed
  const canResumeTimer = () => {
    return isRunning && isPaused;
  };

  // Helper function to check if timer can be stopped
  const canStopTimer = () => {
    return isRunning;
  };

  return {
    // Timer state
    isRunning,
    isPaused,
    remainingTime,
    sessionType,
    plannedDuration,
    currentSession,
    isSystemSleepDetected,
    sessionPreferences,
    
    // Formatted values
    formattedTime,
    progress,
    sessionTypeDisplayName,
    sessionTypeColor,
    
    // Timer controls
    startTimer: startNewSession,
    pauseTimer,
    resumeTimer,
    stopTimer,
    completeSession: completeSessionWithRating,
    
    // Session management
    updateSessionType,
    updatePlannedDuration,
    updateSessionPreferences,
    
    // Task-session integration
    switchTask,
    completeCurrentTask,
    updateTaskActualDuration,
    
    // Helper functions
    getDurationOptions,
    canStartTimer,
    canPauseTimer,
    canResumeTimer,
    canStopTimer,
    
    // Utility functions
    formatTime: timerServiceRef.current.formatTime,
    getSessionProgress: timerServiceRef.current.getSessionProgress,
    getSessionTypeDisplayName: timerServiceRef.current.getSessionTypeDisplayName,
    getSessionTypeColor: timerServiceRef.current.getSessionTypeColor,
  };
};