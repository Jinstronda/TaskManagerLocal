import React from 'react';
import { cn } from '../../utils/cn';

interface CountdownDisplayProps {
  time: string;
  isRunning: boolean;
  isPaused: boolean;
  color: string;
  className?: string;
}

export const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  time,
  isRunning,
  isPaused,
  color,
  className,
}) => {
  return (
    <div className={cn('text-center', className)}>
      <div
        className={cn(
          'font-mono font-bold transition-all duration-300',
          'text-8xl md:text-9xl lg:text-[8rem]', // Minimum 120px font size
          {
            'text-gray-800 dark:text-gray-200': !isRunning,
            'animate-pulse': isPaused,
          }
        )}
        style={{
          color: isRunning ? color : undefined,
          textShadow: isRunning ? `0 0 20px ${color}40` : undefined,
        }}
      >
        {time}
      </div>
      
      {/* Status indicator */}
      <div className="mt-4">
        {isRunning && !isPaused && (
          <div className="flex items-center justify-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: color }}
            />
            <span className="text-lg font-medium" style={{ color }}>
              Focus Time
            </span>
          </div>
        )}
        
        {isRunning && isPaused && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-lg font-medium text-yellow-600 dark:text-yellow-400">
              Paused
            </span>
          </div>
        )}
        
        {!isRunning && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
              Ready
            </span>
          </div>
        )}
      </div>
    </div>
  );
};