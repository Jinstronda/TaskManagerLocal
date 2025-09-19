import React, { useEffect, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStreakStore } from '../../stores/streakStore';

interface HabitChainProps {
  className?: string;
  daysToShow?: number;
  showNavigation?: boolean;
}

/**
 * HabitChain Component
 * 
 * Visual representation of daily habits as a chain of completed days.
 * Shows streak days, missed days, and current progress.
 * Provides navigation to view different time periods.
 */
export const HabitChain: React.FC<HabitChainProps> = ({
  className = '',
  daysToShow = 30,
  showNavigation = true
}) => {
  const { streakInfo, fetchStreakInfo } = useStreakStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchStreakInfo();
  }, [fetchStreakInfo]);

  // Generate array of dates to display
  const generateDateRange = (endDate: Date, days: number) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDateRange(currentDate, daysToShow);
  const today = new Date().toISOString().split('T')[0];

  // Navigation handlers
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - daysToShow);
    setCurrentDate(newDate);
  };

  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + daysToShow);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if a date is a streak day
  const isStreakDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return streakInfo?.streakDates.includes(dateStr) || false;
  };

  // Check if date is today
  const isToday = (date: Date) => {
    return date.toISOString().split('T')[0] === today;
  };

  // Check if date is in the future
  const isFuture = (date: Date) => {
    return date.toISOString().split('T')[0] > today;
  };

  // Get day status for styling
  const getDayStatus = (date: Date) => {
    if (isFuture(date)) return 'future';
    if (isToday(date)) {
      return isStreakDay(date) ? 'today-completed' : 'today-pending';
    }
    return isStreakDay(date) ? 'completed' : 'missed';
  };

  // Get styling classes for each day status
  const getDayClasses = (status: string) => {
    const baseClasses = 'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-110';
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-500 border-green-500 text-white shadow-md`;
      case 'today-completed':
        return `${baseClasses} bg-green-500 border-green-500 text-white shadow-lg ring-2 ring-green-300 dark:ring-green-600`;
      case 'today-pending':
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 text-yellow-700 dark:text-yellow-300 shadow-lg ring-2 ring-yellow-300 dark:ring-yellow-600 animate-pulse`;
      case 'missed':
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500`;
      case 'future':
        return `${baseClasses} bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600`;
      default:
        return baseClasses;
    }
  };

  // Get tooltip text for each day
  const getTooltipText = (date: Date, status: string) => {
    const dateStr = date.toLocaleDateString();
    switch (status) {
      case 'completed':
        return `✅ ${dateStr} - Focus session completed`;
      case 'today-completed':
        return `🎉 ${dateStr} - Today's focus session completed!`;
      case 'today-pending':
        return `⏰ ${dateStr} - Complete a focus session today`;
      case 'missed':
        return `❌ ${dateStr} - No focus session`;
      case 'future':
        return `📅 ${dateStr} - Future date`;
      default:
        return dateStr;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Habit Chain
          </h3>
        </div>
        
        {showNavigation && (
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPeriod}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Previous period"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            >
              Today
            </button>
            
            <button
              onClick={goToNextPeriod}
              disabled={currentDate >= new Date()}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next period"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        )}
      </div>

      {/* Date Range Display */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {dates[0]?.toLocaleDateString()} - {dates[dates.length - 1]?.toLocaleDateString()}
        </p>
      </div>

      {/* Habit Chain Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {/* Day labels */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            {day}
          </div>
        ))}
        
        {/* Empty cells for alignment */}
        {Array.from({ length: dates[0]?.getDay() || 0 }).map((_, index) => (
          <div key={`empty-${index}`} className="w-8 h-8" />
        ))}
        
        {/* Date cells */}
        {dates.map((date, index) => {
          const status = getDayStatus(date);
          const dayNumber = date.getDate();
          
          return (
            <div
              key={index}
              className={getDayClasses(status)}
              title={getTooltipText(date, status)}
            >
              {dayNumber}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
          <span className="text-gray-600 dark:text-gray-400">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          <span className="text-gray-600 dark:text-gray-400">Missed</span>
        </div>
      </div>

      {/* Statistics */}
      {streakInfo && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {streakInfo.streakDates.length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Total Days
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round((streakInfo.streakDates.length / daysToShow) * 100)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Completion Rate
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitChain;