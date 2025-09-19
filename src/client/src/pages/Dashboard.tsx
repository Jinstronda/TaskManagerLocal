import React, { useEffect } from 'react';
import { useNotificationStore } from '../stores/notificationStore';
import { SmartBreakSuggestion, ReviewPrompt } from '../components/Notifications';

const Dashboard: React.FC = () => {
  const { 
    activeBreakSuggestion, 
    activeReviewPrompt,
    checkForBreakSuggestion 
  } = useNotificationStore();

  useEffect(() => {
    // Check for notifications when dashboard loads
    checkForBreakSuggestion();
  }, [checkForBreakSuggestion]);

  return (
    <div className="space-y-6">
      {/* Smart Notifications */}
      {activeBreakSuggestion && <SmartBreakSuggestion />}
      {activeReviewPrompt && <ReviewPrompt />}
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome to your productivity overview</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Focus Time</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">0h 0m</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Sessions Completed</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">0</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Streak</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">0 days</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Focus Score</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">0</p>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Start</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Start your first focus session by navigating to the Timer page.
        </p>
      </div>
    </div>
  )
}

export default Dashboard