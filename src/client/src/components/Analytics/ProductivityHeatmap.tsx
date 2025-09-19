import React from 'react';
import { Activity, Clock, TrendingUp } from 'lucide-react';

interface HeatmapData {
  dayOfWeek: number;
  hour: number;
  averageFocusTime: number;
  sessionCount: number;
  focusScore: number;
}

interface ProductivityHeatmapProps {
  data: HeatmapData[];
  isLoading: boolean;
  error: string | null;
}

const ProductivityHeatmap: React.FC<ProductivityHeatmapProps> = ({
  data,
  isLoading,
  error
}) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Create a map for quick lookup
  const dataMap = new Map<string, HeatmapData>();
  data.forEach(item => {
    const key = `${item.dayOfWeek}-${item.hour}`;
    dataMap.set(key, item);
  });

  // Find max values for normalization
  const maxFocusScore = Math.max(...data.map(d => d.focusScore), 1);
  const maxSessionCount = Math.max(...data.map(d => d.sessionCount), 1);

  const getIntensity = (dayOfWeek: number, hour: number): number => {
    const key = `${dayOfWeek}-${hour}`;
    const item = dataMap.get(key);
    if (!item || item.sessionCount === 0) return 0;
    
    // Combine focus score and session count for intensity
    const scoreWeight = item.focusScore / maxFocusScore;
    const countWeight = item.sessionCount / maxSessionCount;
    return (scoreWeight * 0.7 + countWeight * 0.3);
  };

  const getColor = (intensity: number): string => {
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 0.2) return 'bg-blue-100 dark:bg-blue-900';
    if (intensity < 0.4) return 'bg-blue-200 dark:bg-blue-800';
    if (intensity < 0.6) return 'bg-blue-300 dark:bg-blue-700';
    if (intensity < 0.8) return 'bg-blue-400 dark:bg-blue-600';
    return 'bg-blue-500 dark:bg-blue-500';
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTooltipContent = (dayOfWeek: number, hour: number): string => {
    const key = `${dayOfWeek}-${hour}`;
    const item = dataMap.get(key);
    
    if (!item || item.sessionCount === 0) {
      return `${dayNames[dayOfWeek]} ${hour}:00 - No sessions`;
    }

    return `${dayNames[dayOfWeek]} ${hour}:00
Sessions: ${item.sessionCount}
Avg Focus Time: ${formatTime(item.averageFocusTime)}
Focus Score: ${item.focusScore.toFixed(1)}/100`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Productivity Heatmap
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Productivity Heatmap
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">Error loading heatmap</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Productivity Heatmap
          </h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No productivity data available</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Complete more focus sessions to see your productivity patterns
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Productivity Heatmap
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your focus patterns by day and time
            </p>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800"></div>
            <div className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900"></div>
            <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-800"></div>
            <div className="w-3 h-3 rounded bg-blue-300 dark:bg-blue-700"></div>
            <div className="w-3 h-3 rounded bg-blue-400 dark:bg-blue-600"></div>
            <div className="w-3 h-3 rounded bg-blue-500 dark:bg-blue-500"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-12"></div> {/* Space for day labels */}
            {hours.map(hour => (
              <div key={hour} className="w-6 text-xs text-gray-500 dark:text-gray-400 text-center">
                {hour % 6 === 0 ? hour : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {dayNames.map((dayName, dayIndex) => (
            <div key={dayIndex} className="flex items-center mb-1">
              <div className="w-12 text-xs text-gray-600 dark:text-gray-400 text-right pr-2">
                {dayName}
              </div>
              {hours.map(hour => {
                const intensity = getIntensity(dayIndex, hour);
                const colorClass = getColor(intensity);
                
                return (
                  <div
                    key={hour}
                    className={`w-6 h-4 ${colorClass} border border-gray-200 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-600 transition-all`}
                    title={getTooltipContent(dayIndex, hour)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Clock className="w-4 h-4" />
            <span>Peak Hours</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {(() => {
              const peakHours = data
                .filter(d => d.sessionCount > 0)
                .sort((a, b) => b.focusScore - a.focusScore)
                .slice(0, 2)
                .map(d => `${d.hour}:00`)
                .join(', ');
              return peakHours || 'N/A';
            })()}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Best Day</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {(() => {
              const dayTotals = dayNames.map((_, dayIndex) => {
                const dayData = data.filter(d => d.dayOfWeek === dayIndex);
                const avgScore = dayData.length > 0 
                  ? dayData.reduce((sum, d) => sum + d.focusScore, 0) / dayData.length 
                  : 0;
                return { day: dayNames[dayIndex], score: avgScore };
              });
              const bestDay = dayTotals.sort((a, b) => b.score - a.score)[0];
              return bestDay?.score > 0 ? bestDay.day : 'N/A';
            })()}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Activity className="w-4 h-4" />
            <span>Total Sessions</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {data.reduce((sum, d) => sum + d.sessionCount, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductivityHeatmap;